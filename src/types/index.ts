import type { Severity, PageType } from "@/lib/rubric";

export interface AnalysisRequest {
  url: string;
  targetAudience: string;
  pageGoal?: string;
}

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

export interface EvaluationSummary {
  totalScore: number;
  gradeTier: string;
  understandingTimeSeconds: number;
  executiveSummary: string;
  calibrationNote?: string;
  visualAnalysisUsed?: boolean;
}

export interface PageContext {
  url: string;
  targetAudience: string;
  pageGoal?: string;
  detectedPageType: PageType;
  nicheAssumptions: string[];
  whatShouldNotBeOverPenalized: string[];
}

export interface Finding {
  criterionId: string;
  criterionName: string;
  status: "pass" | "fail" | "warning";
  severity: Severity;
  evidence: string;
  recommendation: string;
  scoreImpact: number;
}

export interface PersonaInsight {
  persona: string;
  firstReaction: string;
  trustReaction: string;
  mainConcern: string;
  recommendation: string;
}

export interface PriorityAction {
  title: string;
  severity: Severity;
  impact: "low" | "medium" | "high";
  difficulty: "easy" | "medium" | "hard";
  currentState: string; // Evidencia: qué hay ahora en la página que causa el problema
  explanation: string;
  exampleFix?: string;
}

export interface RecommendedHeroRewrite {
  currentHeadline: string; // El headline actual de la página
  currentSubheadline?: string; // El subheadline actual (si existe)
  currentCta?: string; // El CTA actual (si existe)
  headline: string; // Propuesta mejorada
  subheadline: string; // Propuesta mejorada
  cta: string; // Propuesta mejorada
  whyBetter: string; // Explicación de qué problema específico del original resuelve la nueva versión
}

export interface ReasonToLeave {
  reason: string;
  severity: Severity;
}

export interface ConversionOpportunity {
  opportunity: string;
  expectedImpact: "low" | "medium" | "high";
}

export interface PageElementsExtracted {
  actualHeadline: string; // El headline/título principal EXACTO encontrado
  actualCTAs: string[]; // Los textos EXACTOS de los CTAs/botones detectados
  actualValueProposition: string; // La propuesta de valor tal como está escrita
  actualTrustElements: string[]; // Elementos de confianza concretos (logos, cifras, etc.)
  keyVisualElements?: string[]; // Elementos visuales destacados en el screenshot (si hay)
}

export interface AnalysisResult {
  evaluationSummary: EvaluationSummary;
  pageContext: PageContext;
  extractedElements: PageElementsExtracted; // Nueva sección: lo que REALMENTE ve antes de opinar
  dimensionScores: DimensionScores;
  findings: Finding[];
  personaInsights: PersonaInsight[];
  priorityActions: PriorityAction[];
  heroRewrite: RecommendedHeroRewrite;
  reasonsToLeave: ReasonToLeave[];
  conversionOpportunities: ConversionOpportunity[];
}

export interface WebsiteData {
  url: string;
  title: string;
  description: string;
  mainContent: string;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  visibleButtons: string[];
  importantLinks: string[];
  callsToAction: string[];
  contactInfo: string[];
  trustSignals: string[];
  screenshot?: string;
}

export interface AnalysisResponse {
  success: boolean;
  data?: AnalysisResult;
  error?: string;
}
