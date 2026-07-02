import type { AnalysisResult, WebsiteData } from "@/types";
import { validateDimensionScores, applyCalibrationRules, calculateTotalScore, ensureRealisticScoring } from "./scoring";
import { getGradeTier, RUBRIC_DIMENSIONS } from "./rubric";

const DEFAULT_MODEL = "openai/gpt-4o-mini";
const FALLBACK_MODEL = "openrouter/auto";

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

  const systemPrompt = `Eres AI First Impression, un auditor experto en UX, copywriting, psicología cognitiva, CRO y claridad web.

Tu trabajo es evaluar una página web desde la perspectiva del público objetivo indicado por el usuario.

IMPORTANTE: No debes afirmar que realmente sientes como humano. Debes hacer una simulación razonada basada en evidencia visible, contenido extraído y buenas prácticas de UX/CRO.

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

  const contentSummary = `
URL: ${websiteData.url}

Título: ${websiteData.title || "No detectado"}
Meta Description: ${websiteData.description || "No detectada"}

Encabezados H1: ${websiteData.headings.h1.join(", ") || "Ninguno"}
Encabezados H2: ${websiteData.headings.h2.slice(0, 5).join(", ") || "Ninguno"}

Botones visibles: ${websiteData.visibleButtons.slice(0, 10).join(", ") || "Ninguno"}
CTAs detectados: ${websiteData.callsToAction.join(", ") || "Ninguno"}

Contenido principal (resumen):
${websiteData.mainContent.slice(0, 2500)}

Señales de confianza: ${websiteData.trustSignals.join(", ") || "Ninguna"}
Info de contacto: ${websiteData.contactInfo.join(", ") || "Ninguna"}
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

  async function callOpenRouter(model: string): Promise<AnalysisResult> {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "AI First Impression",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from AI");
    }

    try {
      const result = JSON.parse(content);
      
      // Validar y calibrar la respuesta
      const validated = validateAndCalibrateResponse(result, websiteData);
      return validated;
    } catch (parseError) {
      throw new Error("Failed to parse AI response as JSON");
    }
  }

  try {
    console.log(`Attempting analysis with model: ${primaryModel}`);
    return await callOpenRouter(primaryModel);
  } catch (primaryError) {
    console.error(`Primary model (${primaryModel}) failed:`, primaryError);
    
    if (primaryModel === FALLBACK_MODEL) {
      throw new Error(
        "No se pudo generar el análisis con OpenRouter. Revisa tu API key, saldo o modelo configurado."
      );
    }

    try {
      console.log(`Attempting analysis with fallback model: ${FALLBACK_MODEL}`);
      return await callOpenRouter(FALLBACK_MODEL);
    } catch (fallbackError) {
      console.error(`Fallback model (${FALLBACK_MODEL}) also failed:`, fallbackError);
      throw new Error(
        "No se pudo generar el análisis con OpenRouter. Revisa tu API key, saldo o modelo configurado."
      );
    }
  }
}

function validateAndCalibrateResponse(rawResult: any, websiteData: WebsiteData): AnalysisResult {
  // Validar y limpiar dimension scores
  let dimensionScores = validateDimensionScores(rawResult.dimensionScores || {});
  
  // Detectar características de la página
  const hasCTA = websiteData.callsToAction.length > 0 || websiteData.visibleButtons.length > 0;
  const hasContact = websiteData.contactInfo.length > 0;
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
      calibrationNote: calibration.calibrationNote
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
