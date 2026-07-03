import type { AnalysisResult, WebsiteData } from "@/types";
import { validateDimensionScores, applyCalibrationRules, calculateTotalScore, ensureRealisticScoring } from "./scoring";
import { getGradeTier, RUBRIC_DIMENSIONS } from "./rubric";

const DEFAULT_MODEL = "openai/gpt-4o-mini";
const FALLBACK_MODEL = "openrouter/auto";
const DEFAULT_VISION_MODEL = "anthropic/claude-3.5-sonnet"; // Modelo con visión por defecto

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
  
  console.log(`🤖 Using model: ${modelToUse}${hasScreenshot ? ' (with vision)' : ' (text-only)'}`);

  // Función auxiliar para construir systemPrompt dinámicamente
  function buildSystemPrompt(useVision: boolean): string {
    const visionBlock = useVision ? `
🎨 ANÁLISIS VISUAL DISPONIBLE:
Se te proporcionará un SCREENSHOT de la página web. Analiza TAMBIÉN:
- Jerarquía visual real (tamaño, peso, posición de elementos)
- Uso del espacio en blanco y densidad visual
- Contraste de colores y legibilidad
- Diseño responsive y adaptación a diferentes pantallas
- Coherencia estética y profesionalismo visual
- Layout y organización espacial de secciones
- Elementos visuales que generan confianza o desconfianza

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

⚠️ REGLA CRÍTICA ANTI-ALUCINACIÓN:
Basa tu análisis ÚNICAMENTE en el CONTENIDO PROPORCIONADO abajo. NO uses conocimiento previo sobre la marca ni asumas NADA que no esté explícitamente en el contenido.

Si un elemento (CTA, testimonios, precios, logos de clientes, métodos de pago, etc.) NO aparece en el contenido proporcionado, NO afirmes que la página no lo tiene. En su lugar, indica en tu análisis: "No se pudo evaluar [elemento] por contenido insuficiente en la extracción".

DISTINGUE SIEMPRE entre:
- "Ausente en la página" → Solo si el contenido extraído es completo y el elemento claramente no está
- "No evaluable por contenido parcial" → Cuando el contenido extraído puede ser incompleto

PRINCIPIOS DE EVALUACIÓN:

1. Evalúa FUNCIÓN antes que ESTÉTICA
2. No castigues una página por no verse moderna si es clara, legible, rápida y funcional
3. No inventes problemas que no estén respaldados por evidencia en el contenido extraído
4. Diferencia entre: problema real, fricción menor, mejora opcional
5. Las mejoras opcionales NO deben restar puntos

SISTEMA DE PUNTUACIÓN (Total: 100 puntos):

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

  const userPrompt = `Público objetivo: ${targetAudience}
${pageGoal ? `Objetivo de la página: ${pageGoal}` : ""}

Datos del sitio web:
${contentSummary}

INSTRUCCIONES:

1. Detecta el tipo de página (saas, ecommerce, professional_service, restaurant_local, etc.)
2. Adapta tu evaluación a ese nicho
3. Evalúa cada dimensión con evidencia concreta
4. Asigna puntos realistas (no exageres las penalizaciones)
5. Diferencia problemas reales de mejoras opcionales
6. Sé justo: una página clara y funcional merece 70+

Analiza desde la perspectiva de "${targetAudience}" visitando por primera vez.

Devuelve el análisis en este formato JSON exacto:

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
    "detectedPageType": string (saas|ecommerce|professional_service|restaurant_local|etc),
    "nicheAssumptions": [string],
    "whatShouldNotBeOverPenalized": [string]
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
      "evidence": string,
      "recommendation": string,
      "scoreImpact": number
    }
  ],
  "personaInsights": [
    {
      "persona": string,
      "firstReaction": string,
      "trustReaction": string,
      "mainConcern": string,
      "recommendation": string
    }
  ],
  "priorityActions": [
    {
      "title": string,
      "severity": "critical"|"high"|"medium"|"low"|"optional",
      "impact": "low"|"medium"|"high",
      "difficulty": "easy"|"medium"|"hard",
      "explanation": string,
      "exampleFix": string
    }
  ],
  "heroRewrite": {
    "headline": string,
    "subheadline": string,
    "cta": string
  },
  "reasonsToLeave": [
    {
      "reason": string,
      "severity": "critical"|"high"|"medium"|"low"|"optional"
    }
  ],
  "conversionOpportunities": [
    {
      "opportunity": string,
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
              url: websiteData.screenshot,
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
    });

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
  }

  try {
    console.log(`Attempting analysis with model: ${modelToUse}`);
    return await callOpenRouter(modelToUse, hasScreenshot);
  } catch (primaryError) {
    console.error(`Primary model (${modelToUse}) failed:`, primaryError);
    
    // Si falla el modelo con visión, intentar con modelo de texto solo
    if (hasScreenshot && modelToUse !== primaryModel) {
      console.log(`🔄 Vision model failed, falling back to text-only model: ${primaryModel}`);
      try {
        return await callOpenRouter(primaryModel, false);
      } catch (fallbackError) {
        console.error(`Text-only fallback also failed:`, fallbackError);
      }
    }
    
    if (modelToUse === FALLBACK_MODEL) {
      throw new Error(
        "No se pudo generar el análisis con OpenRouter. Revisa tu API key, saldo o modelo configurado."
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
    dimensionScores,
    findings: rawResult.findings || [],
    personaInsights: rawResult.personaInsights || [],
    priorityActions: rawResult.priorityActions || [],
    heroRewrite: rawResult.heroRewrite || { headline: "", subheadline: "", cta: "" },
    reasonsToLeave: rawResult.reasonsToLeave || [],
    conversionOpportunities: rawResult.conversionOpportunities || []
  };
}
