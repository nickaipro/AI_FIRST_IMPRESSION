import type { AnalysisResult } from "@/types";

export function getMockAnalysis(
  url: string,
  targetAudience: string,
  pageGoal?: string
): AnalysisResult {
  return {
    evaluationSummary: {
      totalScore: 78,
      gradeTier: "Buena",
      understandingTimeSeconds: 4,
      executiveSummary: `La página comunica claramente su propuesta de valor y tiene un flujo funcional hacia la conversión. El sitio cumple su objetivo principal de forma efectiva. Las principales oportunidades de mejora están en reforzar señales de confianza y optimizar algunos detalles de copy.`,
      calibrationNote: "Score calibrado para no penalizar excesivamente aspectos estéticos menores, ya que la página cumple su objetivo principal de forma clara y funcional."
    },
    pageContext: {
      url,
      targetAudience,
      pageGoal,
      detectedPageType: "saas",
      nicheAssumptions: [
        `El público objetivo (${targetAudience}) necesita entender rápidamente la propuesta de valor`,
        "La claridad del mensaje y el CTA visible son más importantes que la estética premium",
        "La página debe transmitir confianza profesional sin necesitar diseño espectacular"
      ],
      whatShouldNotBeOverPenalized: [
        "Diseño simple o conservador si la comunicación es clara",
        "Ausencia de video si el copy y las imágenes explican bien la propuesta",
        "Falta de animaciones o efectos visuales avanzados",
        "Layout tradicional si la jerarquía visual funciona"
      ]
    },
    dimensionScores: {
      clarity: {
        score: 20,
        maxScore: 25,
        comment: "La propuesta principal se entiende rápido. El hero comunica bien qué se ofrece, aunque el subtítulo podría ser más específico sobre los beneficios concretos."
      },
      trust: {
        score: 14,
        maxScore: 20,
        comment: "Hay señales básicas de confianza presentes (contacto, diseño profesional). Añadir testimonios o logos de clientes aumentaría la credibilidad."
      },
      conversion: {
        score: 16,
        maxScore: 20,
        comment: "El CTA es visible y el siguiente paso está claro. El copy del botón podría ser más específico y orientado a la acción."
      },
      ux: {
        score: 12,
        maxScore: 15,
        comment: "La página es navegable y escaneable. La jerarquía visual es funcional, con pequeñas oportunidades de mejora en espaciado y contraste."
      },
      nicheFit: {
        score: 8,
        maxScore: 10,
        comment: `La página se ajusta bien al tipo de visitante esperado (${targetAudience}). El tono y nivel de detalle son apropiados para el nicho.`
      },
      copyNavigation: {
        score: 8,
        maxScore: 10,
        comment: "El copy es claro y directo. Algunas frases podrían ser más específicas, pero comunica efectivamente el mensaje principal."
      }
    },
    findings: [
      {
        criterionId: "C01",
        criterionName: "Claridad de la propuesta de valor",
        status: "pass",
        severity: "low",
        evidence: "El hero section comunica la propuesta principal sin requerir mucho scroll. El visitante entiende rápidamente qué se ofrece.",
        recommendation: "Mantener la claridad actual. Considerar hacer el subtítulo más específico sobre los beneficios concretos.",
        scoreImpact: 0
      },
      {
        criterionId: "C07",
        criterionName: "Presencia de prueba social",
        status: "warning",
        severity: "medium",
        evidence: "La página muestra profesionalismo pero carece de testimonios, casos de estudio o logos de clientes visibles.",
        recommendation: "Añadir 2-3 testimonios breves con foto cerca del CTA principal, o una fila de logos de clientes conocidos.",
        scoreImpact: -3
      },
      {
        criterionId: "C13",
        criterionName: "Claridad del CTA principal",
        status: "pass",
        severity: "low",
        evidence: "Hay un CTA visible, aunque el texto podría ser más específico y orientado a la acción.",
        recommendation: "Cambiar de texto genérico a algo más específico como 'Solicitar demo' o 'Empezar prueba gratuita'.",
        scoreImpact: 0
      },
      {
        criterionId: "C19",
        criterionName: "Jerarquía visual",
        status: "pass",
        severity: "low",
        evidence: "La página tiene una jerarquía visual funcional que guía la atención del visitante.",
        recommendation: "Aumentar el contraste entre el título principal y el resto del contenido para mejorar la escaneabilidad.",
        scoreImpact: 0
      }
    ],
    personaInsights: [
      {
        persona: `Visitante primerizo (${targetAudience})`,
        firstReaction: "Entiendo rápidamente qué se ofrece y por qué podría ser relevante para mí.",
        trustReaction: "La página parece profesional y legítima, aunque buscaría más evidencia de resultados antes de comprometerme.",
        mainConcern: "Me gustaría ver pruebas de que esto funciona para personas como yo.",
        recommendation: "Añadir testimonios específicos de tu público objetivo cerca del CTA principal."
      },
      {
        persona: "Cliente ideal",
        firstReaction: "Esta solución parece abordar mi problema principal.",
        trustReaction: "Parece confiable pero necesito más validación social antes de actuar.",
        mainConcern: "¿Cuántas personas como yo ya han tenido éxito con esto?",
        recommendation: "Mostrar casos de éxito específicos y métricas de resultados."
      },
      {
        persona: "Comprador escéptico",
        firstReaction: "Suena bien en teoría, pero necesito evidencia.",
        trustReaction: "El diseño es profesional pero falta prueba social sólida.",
        mainConcern: "¿Cómo sé que esto no es demasiado bueno para ser verdad?",
        recommendation: "Añadir garantías, testimonios verificados y reducción de riesgo explícita."
      },
      {
        persona: "Experto UX",
        firstReaction: "Diseño funcional con buena claridad de mensaje.",
        trustReaction: "La usabilidad es sólida. Oportunidades de mejora en detalles visuales.",
        mainConcern: "La jerarquía visual podría ser más fuerte para guiar mejor la atención.",
        recommendation: "Aumentar el tamaño del título principal y mejorar el contraste de colores."
      },
      {
        persona: "Experto en marketing",
        firstReaction: "Mensaje claro con buenos fundamentos de conversión.",
        trustReaction: "Buena base, pero la falta de prueba social reduce el potencial de conversión.",
        mainConcern: "La página no aprovecha suficiente el poder de la validación social.",
        recommendation: "Integrar testimonios, métricas de impacto y logos de clientes de forma prominente."
      }
    ],
    priorityActions: [
      {
        title: "Añadir testimonios o casos de éxito visibles",
        severity: "medium",
        impact: "high",
        difficulty: "easy",
        explanation: "La prueba social es uno de los elementos más poderosos para aumentar conversión. Añadir 2-3 testimonios específicos con foto puede aumentar la confianza significativamente.",
        exampleFix: "Añadir una sección antes o después del CTA con testimonios que incluyan nombre, foto, empresa y resultado específico logrado."
      },
      {
        title: "Hacer el CTA más específico y orientado a la acción",
        severity: "low",
        impact: "medium",
        difficulty: "easy",
        explanation: "Un CTA específico genera más claridad sobre qué pasará al hacer clic, reduciendo fricción mental.",
        exampleFix: "Cambiar de 'Comenzar' a 'Solicitar demo gratuita' o 'Empezar prueba de 14 días'."
      },
      {
        title: "Mejorar el subtítulo con beneficios concretos",
        severity: "low",
        impact: "medium",
        difficulty: "easy",
        explanation: "Un subtítulo que especifique beneficios tangibles ayuda a la comprensión rápida y aumenta el interés.",
        exampleFix: "Añadir métricas o resultados específicos: 'Ahorra 10 horas semanales en [tarea específica]'."
      },
      {
        title: "Aumentar contraste visual del título principal",
        severity: "optional",
        impact: "low",
        difficulty: "easy",
        explanation: "Mejorar la jerarquía visual ayuda a que la propuesta principal destaque más al primer vistazo.",
        exampleFix: "Aumentar el tamaño de fuente del H1 y usar un peso de fuente más bold."
      }
    ],
    heroRewrite: {
      headline: `${targetAudience}: ${pageGoal || "Logra tus objetivos"} en la mitad del tiempo`,
      subheadline: `Deja de perder horas en tareas manuales. Nuestra plataforma automatiza el trabajo pesado para que te enfoques en lo que realmente importa.`,
      cta: pageGoal ? `Empezar ahora` : "Solicitar demo gratuita"
    },
    reasonsToLeave: [
      {
        reason: "Falta de prueba social visible antes del punto de conversión principal",
        severity: "medium"
      },
      {
        reason: "Ausencia de indicadores de riesgo reducido (garantía, prueba gratuita, cancelación fácil)",
        severity: "low"
      },
      {
        reason: "El CTA podría ser más específico sobre el siguiente paso",
        severity: "low"
      }
    ],
    conversionOpportunities: [
      {
        opportunity: "Añadir una sección corta de beneficios específicos antes de la descripción de características",
        expectedImpact: "medium"
      },
      {
        opportunity: "Incluir métricas de impacto o resultados (ej: '10,000+ empresas confían en nosotros')",
        expectedImpact: "medium"
      },
      {
        opportunity: "Agregar una sección de preguntas frecuentes para reducir objeciones comunes",
        expectedImpact: "low"
      },
      {
        opportunity: "Implementar un popup de salida con oferta especial para recuperar visitantes",
        expectedImpact: "low"
      }
    ]
  };
}
