import type { AnalysisResult, WebsiteData } from "@/types";
import { validateDimensionScores, applyCalibrationRules, calculateTotalScore, ensureRealisticScoring } from "./scoring";
import { getGradeTier, RUBRIC_DIMENSIONS } from "./rubric";
import sharp from "sharp";

const DEFAULT_MODEL = "openai/gpt-4o-mini";
const FALLBACK_MODEL = "openrouter/auto";
const DEFAULT_VISION_MODEL = "anthropic/claude-3.5-sonnet";
const MODEL_TIMEOUT_MS = 18000; // 18s timeout por intento individual
const TOTAL_BUDGET_MS = 45000; // 45s presupuesto total (deja 15s de margen antes de maxDuration=60)
const MAX_IMAGE_DIMENSION = 1280; // Redimensionar al lado mayor
const JPEG_QUALITY = 75; // Calidad de compresión JPEG

/**
 * Comprime y redimensiona un screenshot data URL para reducir tokens de visión
 * @param dataUrl Screenshot en formato data:image/...;base64,...
 * @returns Screenshot comprimido en data URL
 */
async function compressScreenshot(dataUrl: string): Promise<string> {
  try {
    // Extraer el base64 del data URL
    const base64Data = dataUrl.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Comprimir y redimensionar con sharp
    const compressed = await sharp(buffer)
      .resize(MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();
    
    // Convertir de vuelta a data URL
    const compressedBase64 = compressed.toString('base64');
    const compressedDataUrl = `data:image/jpeg;base64,${compressedBase64}`;
    
    // Log de reducción
    const originalSize = buffer.length;
    const compressedSize = compressed.length;
    const reduction = Math.round((1 - compressedSize / originalSize) * 100);
    console.log(`📸 Screenshot compressed: ${Math.round(originalSize/1024)}KB → ${Math.round(compressedSize/1024)}KB (${reduction}% reduction)`);
    
    return compressedDataUrl;
  } catch (error) {
    console.error("⚠️ Failed to compress screenshot:", error);
    // En caso de error, devolver el original
    return dataUrl;
  }
}

export async function analyzeWithAI(
  websiteData: WebsiteData,
  targetAudience: string,
  pageGoal?: string
): Promise<AnalysisResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  const primaryModel = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  const visionModel = process.env.OPENROUTER_VISION_MODEL || DEFAULT_VISION_MODEL;
  const hasScreenshot = !!websiteData.screenshot;
  const modelToUse = hasScreenshot ? visionModel : primaryModel;
  
  // Tracking de tiempo para presupuesto
  const startTime = Date.now();
  const checkBudget = () => {
    const elapsed = Date.now() - startTime;
    return elapsed < TOTAL_BUDGET_MS;
  };
  
  console.log(`🤖 Using model: ${modelToUse}${hasScreenshot ? ' (with vision)' : ' (text-only)'}`);
  console.log(`⏱️ Time budget: ${TOTAL_BUDGET_MS}ms total, ${MODEL_TIMEOUT_MS}ms per attempt`);
  // Función auxiliar para construir systemPrompt dinámicamente
  function buildSystemPrompt(useVision: boolean): string {
    const visionBlock = useVision ? `
🎨 ANÁLISIS VISUAL DISPONIBLE:
Se te proporcionará un SCREENSHOT de la página web. Analiza TAMBIÉN:
- Jerarquía visual real (tamaño, peso, posición de elementos)
- Uso del espacio en blanco y densidad visual
- Contraste de colores y legibilidad
- Elementos visuales que generan confianza o desconfianza
- Layout y organización espacial de secciones

Combina el análisis visual (screenshot) con el análisis textual (contenido) para una evaluación completa.
` : `
⚠️ ANÁLISIS SOLO-TEXTO:
NO se proporcionó screenshot. Tu análisis está limitado al contenido textual extraído.
NO evalúes aspectos visuales que no puedes ver (colores, tipografía, espaciado, layout).
Enfócate en: claridad del mensaje, estructura del contenido, copy, jerarquía de información textual.
`;

    return `Eres AI First Impression, un auditor experto en UX, copywriting, psicología cognitiva, CRO y claridad web.

Tu trabajo es evaluar una página web desde la perspectiva del público objetivo indicado por el usuario.

IMPORTANTE: No debes afirmar que realmente sientes como humano. Debes hacer una simulación razonada basada en evidencia visible, contenido extraído y buenas prácticas de UX/CRO.

${visionBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 PRINCIPIO CENTRAL: EVIDENCIA CONCRETA OBLIGATORIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cada afirmación, hallazgo y recomendación DEBE estar anclada a evidencia textual 
o visual concreta de ESTA página específica.

❌ PROHIBIDO: Consejos genéricos que aplicarían a cualquier web.
✅ OBLIGATORIO: Citar elementos reales, textos exactos, o elementos visuales específicos.

Si no puedes citar evidencia concreta de la página para sustentar un hallazgo, 
NO lo incluyas. Un hallazgo sin evidencia es basura y contamina el análisis.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 ESTRUCTURA OBLIGATORIA DEL ANÁLISIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FASE 1: EXTRACCIÓN DE ELEMENTOS REALES (campo "extractedElements")
Antes de puntuar o recomendar NADA, lista lo que REALMENTE ves:

1. actualHeadline: El headline/título principal EXACTO (textual, entrecomillado)
2. actualCTAs: Los textos EXACTOS de los CTAs/botones que detectas (array de strings)
3. actualValueProposition: La propuesta de valor tal como está escrita (textual)
4. actualTrustElements: Elementos de confianza concretos presentes (logos con nombre, 
   cifras específicas, "envío gratis", testimonios específicos, etc.)
5. keyVisualElements: (solo si hay screenshot) Elementos visuales destacados que veas

TODO el análisis posterior debe REFERIRSE a estos elementos citados.

FASE 2: ANÁLISIS Y PUNTUACIÓN
Con los elementos reales identificados, evalúa cada dimensión.

FASE 3: HALLAZGOS Y RECOMENDACIONES
Cada Finding debe incluir:
- evidence: Cita textual o descripción de un elemento REAL de la página
- recommendation: Mejora específica que PARTE del elemento citado en evidence

Cada PriorityAction debe incluir:
- currentState: Qué hay AHORA en la página que causa el problema (cita textual/descripción)
- explanation: Por qué es un problema PARA EL PÚBLICO OBJETIVO específico
- exampleFix: Ejemplo concreto basado en el currentState

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫 LISTA NEGRA: LENGUAJE-PLANTILLA PROHIBIDO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Las siguientes frases están PROHIBIDAS a menos que las acompañes de:
(a) el elemento concreto de la página al que te refieres, y
(b) el cambio específico propuesto con un ejemplo textual

❌ PROHIBIDO usar sin evidencia concreta:
- "mejorar la jerarquía visual"
- "agregar testimonios"
- "optimizar los CTAs"
- "hacer el copy más persuasivo"
- "mejorar la experiencia de usuario"
- "agregar señales de confianza"
- "clarificar la propuesta de valor"
- "mejorar el diseño"

✅ CORRECTO (con evidencia):
- "El CTA actual dice 'Empezar' (genérico). Cambiarlo a 'Ver precios para [nicho]' 
  conecta mejor con [público objetivo] porque [razón específica]"
- "El headline 'Bienvenido a nuestra web' no comunica valor. Propuesta: '[Beneficio 
  específico] para [público objetivo]' porque este público busca [necesidad concreta]"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 PERSONALIZACIÓN POR PÚBLICO OBJETIVO (OBLIGATORIO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CADA recomendación debe conectarse explícitamente con el público objetivo y 
objetivo de la página que el usuario declaró.

Estructura obligatoria para recommendations:
"Para [público objetivo específico] que busca [objetivo], [problema encontrado] 
porque [razón ligada a ese público]. Propuesta: [cambio concreto basado en texto real]."

❌ MAL: "Agregar testimonios aumentaría la confianza"
✅ BIEN: "Para mujeres 25-40 interesadas en moda sostenible, la ausencia de testimonios 
sobre durabilidad es crítica porque este público prioriza inversión a largo plazo sobre 
precio. Propuesta: Agregar sección 'Más de 2 años de uso' con fotos de clientas reales."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✍️ REESCRITURA DE HERO (campo "heroRewrite")
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBLIGATORIO incluir:
- currentHeadline: El headline ACTUAL de la página (textual, exacto)
- currentSubheadline: El subheadline actual si existe
- currentCta: El CTA actual si existe
- headline: Propuesta mejorada
- subheadline: Propuesta mejorada
- cta: Propuesta mejorada
- whyBetter: Explicación de QUÉ problema específico del headline original resuelve 
  tu versión y POR QUÉ es mejor para el público objetivo declarado

❌ PROHIBIDO: Proponer un hero genérico ignorando el que ya existe
✅ OBLIGATORIO: Partir del texto real actual y mejorarlo ("antes → después")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📏 SISTEMA DE PUNTUACIÓN (Total: 100 puntos)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Claridad del mensaje: 25 puntos
- Confianza y credibilidad: 20 puntos
- Conversión y CTA: 20 puntos
- UX, jerarquía y accesibilidad: 15 puntos
- Ajuste al público objetivo y nicho: 10 puntos
- Copywriting y navegación: 10 puntos

CALIBRACIÓN REALISTA:
- Una página fea pero clara, rápida, funcional y con CTA visible debe poder sacar 75-85
- Una página bonita pero confusa debe sacar menos de 50
- Una página que cumple su objetivo básico no debe bajar de 70
- No penalices excesivamente aspectos estéticos si la página funciona

ADAPTACIÓN POR NICHO:
Detecta el tipo de página y adapta la evaluación:
- SaaS: prioriza claridad de producto, demo, logos
- E-commerce: prioriza producto, precio, confianza, compra
- Servicio profesional: prioriza credenciales, contacto, problema resuelto
- Restaurante/local: prioriza ubicación, horario, contacto, menú
- Educación: prioriza autoridad, resultado, temario, testimonios
- Industrial B2B: permite alta densidad técnica si está organizada
- Lujo/premium: permite poco texto si la propuesta se entiende

SEVERIDAD:
- critical: Bloquea comprensión, confianza o acción
- high: Reduce conversión significativamente
- medium: Aumenta carga cognitiva
- low: Microfricciones mejorables
- optional: Optimización avanzada, no problema

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ REGLA CRÍTICA ANTI-ALUCINACIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Basa tu análisis ÚNICAMENTE en el CONTENIDO PROPORCIONADO abajo. NO uses 
conocimiento previo sobre la marca ni asumas NADA que no esté explícitamente 
en el contenido.

Si un elemento NO aparece en el contenido proporcionado, NO afirmes que la 
página no lo tiene. Indica: "No se pudo evaluar [elemento] por contenido 
insuficiente en la extracción".

PRINCIPIOS DE EVALUACIÓN:
1. Evalúa FUNCIÓN antes que ESTÉTICA
2. No castigues una página por no verse moderna si es clara, legible y funcional
3. No inventes problemas que no estén respaldados por evidencia
4. Diferencia entre: problema real, fricción menor, mejora opcional
5. Las mejoras opcionales NO deben restar puntos

RESPONDE ÚNICAMENTE CON JSON VÁLIDO. NO USES MARKDOWN. NO INCLUYAS RAZONAMIENTO PRIVADO.`;
  }


  const systemPrompt = buildSystemPrompt(hasScreenshot);

  const contentSummary = `
URL: ${websiteData.url}

Título: ${websiteData.title || "No detectado"}
Meta Description: ${websiteData.description || "No detectada"}

Encabezados H1: ${websiteData.headings.h1.join(", ") || "No detectados"}
Encabezados H2: ${websiteData.headings.h2.slice(0, 5).join(", ") || "No detectados"}

${websiteData.visibleButtons.length > 0 ? `Botones visibles: ${websiteData.visibleButtons.slice(0, 10).join(", ")}` : "Botones visibles: No extraídos estructuralmente — evalúa este elemento a partir del contenido y, sobre todo, del screenshot."}
${websiteData.callsToAction.length > 0 ? `CTAs detectados: ${websiteData.callsToAction.join(", ")}` : "CTAs detectados: No extraídos estructuralmente — evalúa este elemento a partir del contenido y, sobre todo, del screenshot."}

Contenido principal (primeros 10,000 caracteres):
${websiteData.mainContent.slice(0, 10000)}

${websiteData.trustSignals.length > 0 ? `Señales de confianza: ${websiteData.trustSignals.join(", ")}` : "Señales de confianza: No extraídas estructuralmente — evalúa este elemento a partir del contenido y screenshot."}
${websiteData.contactInfo.length > 0 ? `Info de contacto: ${websiteData.contactInfo.join(", ")}` : "Info de contacto: No extraída estructuralmente — evalúa este elemento a partir del contenido y screenshot."}
`.trim();

  const userPrompt = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 CONTEXTO DEL ANÁLISIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Público objetivo: ${targetAudience}
${pageGoal ? `Objetivo de la página: ${pageGoal}` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 DATOS DEL SITIO WEB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${contentSummary}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 INSTRUCCIONES CRÍTICAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PASO 1: EXTRAE LOS ELEMENTOS REALES PRIMERO (campo "extractedElements")
Antes de evaluar o recomendar nada, identifica:
- actualHeadline: El headline/título principal EXACTO (entre comillas)
- actualCTAs: Array de textos EXACTOS de botones/CTAs que veas
- actualValueProposition: La propuesta de valor tal como está escrita
- actualTrustElements: Elementos concretos (logos con nombre, cifras, testimonios)
- keyVisualElements: (solo si hay screenshot) Elementos visuales destacados

PASO 2: ANALIZA Y PUNTÚA
Con los elementos reales identificados, evalúa cada dimensión.

PASO 3: GENERA HALLAZGOS Y RECOMENDACIONES ANCLADAS
- Cada Finding.evidence debe citar texto/elemento real de la página
- Cada Finding.recommendation debe partir de ese elemento citado
- Cada PriorityAction.currentState debe describir qué hay AHORA (cita real)
- Cada PriorityAction.explanation debe conectar con el público objetivo específico
- heroRewrite.currentHeadline debe ser el headline ACTUAL exacto
- heroRewrite.whyBetter debe explicar QUÉ problema del original resuelves

🚫 PROHIBIDO: Consejos genéricos sin evidencia concreta
✅ OBLIGATORIO: Anclar cada recomendación al público objetivo y elementos reales

Analiza desde la perspectiva de "${targetAudience}" visitando por primera vez.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 FORMATO JSON EXACTO (devuelve SOLO esto, sin markdown)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "evaluationSummary": {
    "totalScore": number,
    "gradeTier": string,
    "understandingTimeSeconds": number,
    "executiveSummary": string
  },
  "pageContext": {
    "url": string,
    "targetAudience": string,
    "pageGoal": string,
    "detectedPageType": string (saas|ecommerce|professional_service|restaurant_local|education|industrial_b2b|luxury|etc),
    "nicheAssumptions": [string],
    "whatShouldNotBeOverPenalized": [string]
  },
  "extractedElements": {
    "actualHeadline": string (EXACTO, entre comillas),
    "actualCTAs": [string] (textos EXACTOS de botones),
    "actualValueProposition": string (tal como está escrita),
    "actualTrustElements": [string] (elementos concretos con nombres/cifras),
    "keyVisualElements": [string] (opcional, solo si hay screenshot)
  },
  "dimensionScores": {
    "clarity": {"score": number, "maxScore": 25, "comment": string},
    "trust": {"score": number, "maxScore": 20, "comment": string},
    "conversion": {"score": number, "maxScore": 20, "comment": string},
    "ux": {"score": number, "maxScore": 15, "comment": string},
    "nicheFit": {"score": number, "maxScore": 10, "comment": string},
    "copyNavigation": {"score": number, "maxScore": 10, "comment": string}
  },
  "findings": [
    {
      "criterionId": string,
      "criterionName": string,
      "status": "pass"|"fail"|"warning",
      "severity": "critical"|"high"|"medium"|"low"|"optional",
      "evidence": string (CITA TEXTUAL o descripción de elemento REAL),
      "recommendation": string (mejora específica conectada al público objetivo),
      "scoreImpact": number
    }
  ],
  "personaInsights": [
    {
      "persona": string (basado en targetAudience),
      "firstReaction": string (conectado a elementos reales extraídos),
      "trustReaction": string (conectado a actualTrustElements),
      "mainConcern": string (específico para este público y esta página),
      "recommendation": string (anclada a evidencia real)
    }
  ],
  "priorityActions": [
    {
      "title": string,
      "severity": "critical"|"high"|"medium"|"low"|"optional",
      "impact": "low"|"medium"|"high",
      "difficulty": "easy"|"medium"|"hard",
      "currentState": string (QUÉ hay AHORA - cita textual/descripción real),
      "explanation": string (por qué es problema para targetAudience específico),
      "exampleFix": string (ejemplo concreto basado en currentState)
    }
  ],
  "heroRewrite": {
    "currentHeadline": string (headline ACTUAL exacto),
    "currentSubheadline": string (subheadline actual si existe, o ""),
    "currentCta": string (CTA actual si existe, o ""),
    "headline": string (propuesta mejorada),
    "subheadline": string (propuesta mejorada),
    "cta": string (propuesta mejorada),
    "whyBetter": string (qué problema del original resuelves y por qué es mejor para targetAudience)
  },
  "reasonsToLeave": [
    {
      "reason": string (conectado a elementos reales extraídos),
      "severity": "critical"|"high"|"medium"|"low"|"optional"
    }
  ],
  "conversionOpportunities": [
    {
      "opportunity": string (anclada a elementos reales y targetAudience),
      "expectedImpact": "low"|"medium"|"high"
    }
  ]
}`;

  async function callOpenRouter(model: string, useVision: boolean = false): Promise<AnalysisResult> {
    // Obtener el referer correcto (Vercel URL en producción, localhost en desarrollo)
    const referer = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : "http://localhost:3000";
    
    console.log("Calling OpenRouter with model:", model);
    console.log("HTTP-Referer:", referer);
    console.log("Use vision:", useVision);

    // Construir systemPrompt específico para esta llamada
    const systemPromptForCall = buildSystemPrompt(useVision);

    // Construir el mensaje del usuario según si se usa visión
    let userMessage: any;
    
    if (useVision && websiteData.screenshot) {
      // Comprimir screenshot antes de enviarlo para reducir tokens de visión
      const compressedScreenshot = await compressScreenshot(websiteData.screenshot);
      
      // Mensaje multimodal con imagen
      userMessage = {
        role: "user",
        content: [
          {
            type: "text",
            text: userPrompt,
          },
          {
            type: "image_url",
            image_url: {
              url: compressedScreenshot,
            },
          },
        ],
      };
    } else {
      // Mensaje solo texto
      userMessage = {
        role: "user",
        content: userPrompt,
      };
    }

    // AbortController con timeout para este intento
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": referer,
          "X-Title": "AI First Impression",
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: systemPromptForCall },
            userMessage,
          ],
          temperature: 0.3,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ OpenRouter returned ${response.status}:`, errorText);
        throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        console.error("❌ OpenRouter returned empty content:", data);
        throw new Error("OpenRouter devolvió una respuesta vacía");
      }

      try {
        const result = JSON.parse(content);
        console.log("✅ Successfully parsed AI response");
        
        // Validar y calibrar la respuesta
        const validated = validateAndCalibrateResponse(result, websiteData, useVision);
        return validated;
      } catch (parseError) {
        console.error("❌ Failed to parse AI response:", content.substring(0, 200));
        throw new Error(`El modelo devolvió un formato inválido: ${parseError instanceof Error ? parseError.message : 'Error de parseo'}`);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Manejar timeout específicamente
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`El modelo ${model} está tardando más de lo esperado (>${MODEL_TIMEOUT_MS/1000}s)`);
      }
      
      throw error;
    }
  }

  try {
    console.log(`Attempting analysis with model: ${modelToUse}`);
    return await callOpenRouter(modelToUse, hasScreenshot);
  } catch (primaryError) {
    console.error(`Primary model (${modelToUse}) failed:`, primaryError);
    const elapsed = Date.now() - startTime;
    console.log(`⏱️ Time elapsed: ${elapsed}ms of ${TOTAL_BUDGET_MS}ms budget`);
    
    // Si falla el modelo con visión, intentar con modelo de texto solo
    if (hasScreenshot && modelToUse !== primaryModel) {
      // Verificar presupuesto antes de reintentar
      if (!checkBudget()) {
        console.error(`⏱️ Time budget exhausted (${elapsed}ms), cannot retry`);
        throw new Error(
          "El análisis está tardando más de lo normal. Por favor, intenta de nuevo en un momento."
        );
      }
      
      console.log(`🔄 Vision model failed, falling back to text-only model: ${primaryModel}`);
      try {
        return await callOpenRouter(primaryModel, false);
      } catch (fallbackError) {
        console.error(`Text-only fallback also failed:`, fallbackError);
        const elapsedAfter = Date.now() - startTime;
        console.log(`⏱️ Time elapsed after fallback: ${elapsedAfter}ms`);
      }
    }
    
    if (modelToUse === FALLBACK_MODEL) {
      throw new Error(
        "No se pudo generar el análisis con OpenRouter. Revisa tu API key, saldo o modelo configurado."
      );
    }

    // Verificar presupuesto antes del último intento
    const elapsedBefore = Date.now() - startTime;
    if (!checkBudget()) {
      console.error(`⏱️ Time budget exhausted (${elapsedBefore}ms), cannot try final fallback`);
      throw new Error(
        "El análisis está tardando más de lo normal. Por favor, intenta de nuevo en un momento."
      );
    }

    try {
      console.log(`Attempting analysis with fallback model: ${FALLBACK_MODEL}`);
      return await callOpenRouter(FALLBACK_MODEL, false);
    } catch (fallbackError) {
      console.error(`Fallback model (${FALLBACK_MODEL}) also failed:`, fallbackError);
      throw new Error(
        "No se pudo generar el análisis con OpenRouter. Revisa tu API key, saldo o modelo configurado."
      );
    }
  }
}

function validateAndCalibrateResponse(rawResult: any, websiteData: WebsiteData, visualAnalysisUsed: boolean = false): AnalysisResult {
  // Validar y limpiar dimension scores
  let dimensionScores = validateDimensionScores(rawResult.dimensionScores || {});
  
  // Detectar características de la página
  // Si hay arrays poblados, úsalos. Si hay análisis visual, también considera los findings del modelo
  let hasCTA = websiteData.callsToAction.length > 0 || websiteData.visibleButtons.length > 0;
  let hasContact = websiteData.contactInfo.length > 0;
  
  // Si se usó análisis visual y los arrays de texto están vacíos, derivar de los findings del modelo
  if (visualAnalysisUsed) {
    const allFindings = [
      ...(rawResult.dimensionScores?.clarityOfMessage?.findings || []),
      ...(rawResult.dimensionScores?.conversionOptimization?.findings || []),
      ...(rawResult.dimensionScores?.userExperience?.findings || []),
    ].map((f: any) => (f.title + ' ' + f.description).toLowerCase());
    
    // Buscar menciones de CTAs o botones en los findings del modelo
    if (!hasCTA) {
      hasCTA = allFindings.some((text: string) => 
        /\b(?:cta|call.to.action|button|sign.?up|get.?started|buy|shop|contact.?us|request|demo|try.?free)\b/.test(text)
      );
    }
    
    // Buscar menciones de info de contacto en los findings del modelo
    if (!hasContact) {
      hasContact = allFindings.some((text: string) => 
        /\b(?:contact|email|phone|address|form|support|tel:|mailto:)\b/.test(text)
      );
    }
  }
  
  const isClear = websiteData.title.length > 0 && websiteData.headings.h1.length > 0;
  
  // Ajustar scores poco realistas
  dimensionScores = ensureRealisticScoring(dimensionScores, hasCTA, hasContact, isClear);
  
  // Calcular score total
  const rawScore = calculateTotalScore(dimensionScores);
  
  // Extraer issues críticos
  const criticalIssues = (rawResult.findings || [])
    .filter((f: any) => f.severity === "critical")
    .map((f: any) => f.evidence);
  
  // Aplicar calibración
  const calibration = applyCalibrationRules(
    rawScore,
    dimensionScores,
    criticalIssues,
    rawResult.pageContext?.detectedPageType
  );
  
  return {
    evaluationSummary: {
      totalScore: calibration.totalScore,
      gradeTier: getGradeTier(calibration.totalScore),
      understandingTimeSeconds: rawResult.evaluationSummary?.understandingTimeSeconds || 5,
      executiveSummary: rawResult.evaluationSummary?.executiveSummary || "",
      calibrationNote: calibration.calibrationNote,
      visualAnalysisUsed
    },
    pageContext: rawResult.pageContext || {
      url: websiteData.url,
      targetAudience: "",
      detectedPageType: "unknown",
      nicheAssumptions: [],
      whatShouldNotBeOverPenalized: []
    },
    extractedElements: rawResult.extractedElements || {
      actualHeadline: websiteData.headings.h1[0] || websiteData.title || "",
      actualCTAs: websiteData.callsToAction || [],
      actualValueProposition: websiteData.description || "",
      actualTrustElements: websiteData.trustSignals || [],
      keyVisualElements: []
    },
    dimensionScores,
    findings: rawResult.findings || [],
    personaInsights: rawResult.personaInsights || [],
    priorityActions: rawResult.priorityActions || [],
    heroRewrite: rawResult.heroRewrite || { 
      currentHeadline: websiteData.headings.h1[0] || "",
      currentSubheadline: "",
      currentCta: "",
      headline: "", 
      subheadline: "", 
      cta: "",
      whyBetter: ""
    },
    reasonsToLeave: rawResult.reasonsToLeave || [],
    conversionOpportunities: rawResult.conversionOpportunities || []
  };
}
