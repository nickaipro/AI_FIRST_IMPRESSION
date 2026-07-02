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
  explanation: string;
  exampleFix?: string;
}

export interface RecommendedHeroRewrite {
  headline: string;
  subheadline: string;
  cta: string;
}

export interface ReasonToLeave {
  reason: string;
  severity: Severity;
}

export interface ConversionOpportunity {
  opportunity: string;
  expectedImpact: "low" | "medium" | "high";
}

export interface AnalysisResult {
  evaluationSummary: EvaluationSummary;
  pageContext: PageContext;
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
