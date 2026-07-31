export interface ImportProfile {
  education?: string;
  skills?: string[];
  country?: string;
  careerGoal?: string;
  experienceLevel?: string;
  email?: string;
}

export interface ImportInput {
  url?: string;
  text?: string;
  profile: ImportProfile;
}

export interface ExtractedOpportunity {
  title: string;
  provider: string;
  type: string;
  description: string;
  eligibilityCriteria: string;
  benefits: string | null;
  applicationUrl: string | null;
  deadline: string | null;
  deadlineText: string | null;
  location: string | null;
  isRemote: boolean;
  targetAudience: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  experienceLevel: string | null;
  tags: string[];
  fundingDetails: string | null;
}

export interface EvaluationResult {
  fitScore: number;
  verdict: "strong" | "possible" | "unlikely";
  summary: string;
  reasons: string[];
  eligibilityChecklist: Array<{ item: string; met: boolean; note: string }>;
  grounded?: boolean;
  evidence?: { checklistRatio: number | null; skillOverlap: number | null };
}

export interface GapAnalysisResult {
  skillGaps: Array<{ skill: string; priority: "high" | "medium" | "low"; effortWeeks: number }>;
  learningRoadmap: Array<{ phase: string; focus: string; resources: string[] }>;
  estimatedPrepWeeks: number;
}

export interface SimilarOpportunity {
  title: string;
  provider: string;
  type: string;
  description: string;
  applicationUrl: string;
}

export interface StrategyResult {
  overview: string;
  timeline: Array<{ week: string; action: string; detail: string }>;
  documentsNeeded: string[];
  checklist: string[];
  riskFactors: string[];
}

export interface VerificationInfo {
  url: string | null;
  urlOk: boolean;
  urlStatus: number | null;
  deadlineOk: boolean;
}

export interface ImportReport {
  status: "complete" | "failed";
  sourceUrl: string | null;
  fitScore: number;
  verdict: string;
  opportunityId: string;
  slug: string;
  extraction: ExtractedOpportunity;
  evaluation: EvaluationResult;
  gapAnalysis: GapAnalysisResult;
  research: SimilarOpportunity[];
  strategy: StrategyResult;
  nextSteps: string[];
  duration: number;
  completedAt: string;
  verification?: VerificationInfo;
}
