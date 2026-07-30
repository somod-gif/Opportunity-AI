export type OpportunityType =
  | "scholarship"
  | "fellowship"
  | "job"
  | "internship"
  | "grant"
  | "accelerator"
  | "competition"
  | "conference"
  | "research"
  | "hackathon"
  | "bootcamp"
  | "exchange";

export interface Opportunity {
  id: string;
  title: string;
  slug: string;
  type: OpportunityType;
  provider: string;
  description: string;
  eligibilityCriteria: string;
  benefits?: string;
  applicationUrl?: string;
  deadline?: string;
  location?: string;
  isRemote: boolean;
  targetAudience: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  experienceLevel?: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MatchResult {
  title: string;
  provider: string;
  matchScore: number;
  type: OpportunityType;
  deadline: string | null;
  whyYouQualify: string[];
  gaps: string[];
  competitiveness: "low" | "medium" | "high";
  probability: number;
  nextSteps: string[];
  eligibilitySummary: string;
  rankScore?: number;
}

export type DocumentType =
  | "cover-letter"
  | "personal-statement"
  | "resume"
  | "checklist";

export interface ApplicationDocument {
  type: DocumentType;
  content: string;
  opportunityTitle: string;
  generatedAt: string;
}

export interface ApplicationRoadmap {
  timeline: string;
  steps: RoadmapStep[];
  requiredDocuments: string[];
  preparationTips: string[];
  checklist: string[];
  estimatedTotalHours: number;
}

export interface RoadmapStep {
  step: number;
  title: string;
  description: string;
  deadline: string;
  estimatedHours: number;
}
