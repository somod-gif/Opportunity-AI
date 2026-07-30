import { getProvider } from "./registry";
import { buildProfileAnalysisPrompt } from "./prompts/profile-analysis";
import { buildOpportunityMatchingPrompt } from "./prompts/opportunity-matching";
import { buildRoadmapPrompt } from "./prompts/roadmap-generation";
import { buildDocumentPrompt } from "./prompts/document-generation";
import { CareerAgent, type AgentResult } from "./agent";
import type {
  AnalysisInput,
  ProfileAnalysis,
  MatchResult,
  ApplicationRoadmap,
  GeneratedDocument,
  DocumentType,
} from "./prompts";

let provider: ReturnType<typeof getProvider> | null = null;

function getAI() {
  if (!provider) provider = getProvider();
  return provider;
}

export const ai = {
  async analyzeProfile(input: AnalysisInput): Promise<ProfileAnalysis> {
    const prompt = buildProfileAnalysisPrompt(input);
    return getAI().generateJSON<ProfileAnalysis>("profile-analysis", prompt);
  },

  async matchOpportunities(
    profile: AnalysisInput,
    analysis: ProfileAnalysis,
    opportunities: Array<{
      title: string;
      type: string;
      provider: string;
      description: string;
      eligibilityCriteria: string;
      requiredSkills: string[] | null;
      preferredSkills: string[] | null;
      deadline: string | null;
      tags: string[] | null;
    }>
  ): Promise<MatchResult[]> {
    const prompt = buildOpportunityMatchingPrompt(profile, analysis, opportunities);
    const result = await getAI().generateJSON<{ matches: MatchResult[] }>("opportunity-matching", prompt);
    return result.matches;
  },

  async generateRoadmap(
    input: AnalysisInput,
    opportunity: {
      title: string;
      provider: string;
      type: string;
      description: string;
      eligibilityCriteria: string;
      deadline: string | null;
    },
    matchReasoning: {
      whyYouQualify: string[];
      gaps: string[];
      nextSteps: string[];
    }
  ): Promise<ApplicationRoadmap> {
    const prompt = buildRoadmapPrompt(input, opportunity, matchReasoning);
    return getAI().generateJSON<ApplicationRoadmap>("roadmap-generation", prompt);
  },

  async generateDocument(
    type: DocumentType,
    input: AnalysisInput,
    opportunity: {
      title: string;
      provider: string;
      type: string;
      description: string;
      eligibilityCriteria: string;
      deadline: string | null;
    }
  ): Promise<GeneratedDocument> {
    const prompt = buildDocumentPrompt(type, input, opportunity);
    return getAI().generateJSON<GeneratedDocument>("document-generation", prompt);
  },

  async runAgent(input: AnalysisInput): Promise<AgentResult> {
    const agent = new CareerAgent(input);
    return agent.run();
  },
};
