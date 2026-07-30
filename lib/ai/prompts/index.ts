export interface AnalysisInput {
  name?: string;
  education: string;
  skills: string[];
  careerGoal: string;
  country: string;
}

export interface ProfileAnalysis {
  summary: string;
  careerStage: string;
  inferredSkills: string[];
  experienceLevel: string;
  interests: string[];
  strengths: string[];
  growthAreas: string[];
}

export interface MatchResult {
  title: string;
  provider: string;
  matchScore: number;
  type: string;
  deadline: string | null;
  whyYouQualify: string[];
  gaps: string[];
  competitiveness: string;
  probability: number;
  nextSteps: string[];
  eligibilitySummary: string;
}

export interface RoadmapStep {
  step: number;
  title: string;
  description: string;
  deadline: string;
  estimatedHours: number;
}

export interface ApplicationRoadmap {
  timeline: string;
  steps: RoadmapStep[];
  requiredDocuments: string[];
  preparationTips: string[];
  checklist: string[];
  estimatedTotalHours: number;
}

export interface GeneratedDocument {
  content: string;
}

export type DocumentType = "cover-letter" | "personal-statement" | "checklist" | "resume";

export const OUTPUT_FORMAT_INSTRUCTION = `Return ONLY valid JSON. No markdown, no code fences, no explanation.`;
