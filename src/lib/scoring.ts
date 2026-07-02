import { RUBRIC_DIMENSIONS, type DimensionKey, type PageType } from "./rubric";

export interface DimensionScore {
  score: number;
  maxScore: number;
  comment: string;
}

export interface DimensionScores {
  clarity: DimensionScore;
  trust: DimensionScore;
  conversion: DimensionScore;
  ux: DimensionScore;
  nicheFit: DimensionScore;
  copyNavigation: DimensionScore;
}

export function calculateTotalScore(dimensionScores: DimensionScores): number {
  return Object.values(dimensionScores).reduce((sum, dim) => sum + dim.score, 0);
}

export function validateDimensionScores(dimensionScores: DimensionScores): DimensionScores {
  const validated: any = {};
  
  for (const [key, value] of Object.entries(dimensionScores)) {
    const dimension = RUBRIC_DIMENSIONS[key as DimensionKey];
    if (!dimension) continue;
    
    validated[key] = {
      score: Math.max(0, Math.min(value.score, dimension.maxPoints)),
      maxScore: dimension.maxPoints,
      comment: value.comment || ""
    };
  }
  
  return validated as DimensionScores;
}

interface CalibrationResult {
  totalScore: number;
  calibrationNote: string;
  appliedRules: string[];
}

export function applyCalibrationRules(
  rawScore: number,
  dimensionScores: DimensionScores,
  criticalIssues: string[],
  pageType?: PageType
): CalibrationResult {
  const appliedRules: string[] = [];
  let calibratedScore = rawScore;
  let calibrationNote = "";

  // Regla 1: Techos forzados por problemas críticos
  const caps = applyScoreCaps(criticalIssues);
  if (caps.cap < 100) {
    calibratedScore = Math.min(calibratedScore, caps.cap);
    appliedRules.push(caps.reason);
  }

  // Regla 2: Página funcional clara (piso mínimo 70)
  if (isFunctionalAndClear(dimensionScores) && criticalIssues.length === 0) {
    if (calibratedScore < 70) {
      appliedRules.push("Piso mínimo 70: La página es clara y funcional");
      calibratedScore = Math.max(calibratedScore, 70);
    }
  }

  // Regla 3: Amnistía estética
  if (isAestheticPenalty(dimensionScores) && isFunctionalAndClear(dimensionScores)) {
    const boost = 5;
    appliedRules.push("Amnistía estética: No se penaliza diseño simple si la página funciona");
    calibratedScore = Math.min(calibratedScore + boost, 100);
  }

  // Generar nota de calibración
  if (appliedRules.length > 0) {
    calibrationNote = `Score calibrado para ser más justo: ${appliedRules.join(". ")}.`;
  }

  return {
    totalScore: Math.round(calibratedScore),
    calibrationNote,
    appliedRules
  };
}

function applyScoreCaps(criticalIssues: string[]): { cap: number; reason: string } {
  // Analizar issues críticos y aplicar techos
  const issues = criticalIssues.map(i => i.toLowerCase());
  
  if (issues.some(i => i.includes("no se entiende qué") || i.includes("propuesta de valor ausente"))) {
    return { cap: 49, reason: "Techo 49: No se entiende qué ofrece" };
  }
  
  if (issues.some(i => i.includes("no hay cta") || i.includes("sin llamada a la acción"))) {
    return { cap: 55, reason: "Techo 55: No hay CTA claro" };
  }
  
  if (issues.some(i => i.includes("ilegible") || i.includes("rota") || i.includes("no carga"))) {
    return { cap: 30, reason: "Techo 30: Página rota o ilegible" };
  }
  
  if (issues.some(i => i.includes("no hay precio") && i.includes("ecommerce"))) {
    return { cap: 60, reason: "Techo 60: E-commerce sin precio o proceso claro" };
  }
  
  if (issues.some(i => i.includes("engañoso") || i.includes("sospechoso"))) {
    return { cap: 50, reason: "Techo 50: Contenido engañoso o sospechoso" };
  }
  
  return { cap: 100, reason: "" };
}

function isFunctionalAndClear(dimensionScores: DimensionScores): boolean {
  // Página es funcional y clara si:
  // - Claridad >= 17/25 (68%)
  // - Conversión >= 13/20 (65%)
  // - UX >= 10/15 (67%)
  
  return (
    dimensionScores.clarity.score >= 17 &&
    dimensionScores.conversion.score >= 13 &&
    dimensionScores.ux.score >= 10
  );
}

function isAestheticPenalty(dimensionScores: DimensionScores): boolean {
  // Detectar si la penalización principal es estética:
  // Buena claridad y conversión, pero UX o copy bajos podrían ser estéticos
  
  return (
    dimensionScores.clarity.score >= 18 &&
    dimensionScores.conversion.score >= 15 &&
    (dimensionScores.ux.score < 12 || dimensionScores.copyNavigation.score < 7)
  );
}

export function ensureRealisticScoring(
  dimensionScores: DimensionScores,
  hasCTA: boolean,
  hasContact: boolean,
  isClear: boolean
): DimensionScores {
  // Ajustar scores poco realistas
  const adjusted = { ...dimensionScores };
  
  // Si la página es clara, el mínimo de claridad debe ser razonable
  if (isClear && adjusted.clarity.score < 15) {
    adjusted.clarity.score = Math.max(adjusted.clarity.score, 17);
  }
  
  // Si hay CTA visible, conversión no puede ser muy baja
  if (hasCTA && adjusted.conversion.score < 12) {
    adjusted.conversion.score = Math.max(adjusted.conversion.score, 14);
  }
  
  // Si hay contacto visible, confianza básica asegurada
  if (hasContact && adjusted.trust.score < 8) {
    adjusted.trust.score = Math.max(adjusted.trust.score, 10);
  }
  
  return adjusted;
}
