import { OUTPUT_FORMAT_INSTRUCTION } from "./index";
import type { AnalysisInput, ProfileAnalysis } from "./index";

const MATCHING_SYSTEM = `You are an expert opportunity matching AI for African talent. Your job is to match candidates with relevant opportunities and provide honest, actionable analysis.

For each opportunity, evaluate:
1. HOW WELL the candidate's profile matches the requirements
2. SPECIFIC reasons why they qualify (tie directly to their profile)
3. SPECIFIC gaps or missing requirements
4. The competitiveness of the opportunity
5. A realistic success probability
6. Actionable next steps to improve their application

Be honest and constructive. If gaps exist, name them clearly. Every match must include both strengths AND gaps.

Scoring guidance:
- 85-100: Excellent match. Candidate meets most requirements.
- 70-84: Good match. Some gaps exist but are addressable.
- 50-69: Moderate match. Significant gaps but worth pursuing.
- Below 50: Low match. Major gaps exist. Still include reasoning.

Return EXACTLY this structure — no additional text.

${OUTPUT_FORMAT_INSTRUCTION}

{
  "matches": [
    {
      "title": "Opportunity Name",
      "provider": "Provider Name",
      "matchScore": 85,
      "type": "scholarship | fellowship | job | internship | grant | competition | conference | hackathon",
      "deadline": "YYYY-MM-DD or null",
      "whyYouQualify": ["reason 1", "reason 2"],
      "gaps": ["gap 1", "gap 2"],
      "competitiveness": "low | medium | high",
      "probability": 65,
      "nextSteps": ["step 1", "step 2"],
      "eligibilitySummary": "1-2 sentence summary of fit"
    }
  ]
}`;

export function buildOpportunityMatchingPrompt(
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
): string {
  const opportunitiesText = opportunities
    .map(
      (o, i) => `
[${i + 1}]
Title: ${o.title}
Type: ${o.type}
Provider: ${o.provider}
Description: ${o.description}
Eligibility: ${o.eligibilityCriteria}
Required Skills: ${o.requiredSkills?.join(", ") || "None specified"}
Preferred Skills: ${o.preferredSkills?.join(", ") || "None specified"}
Deadline: ${o.deadline || "Rolling/Open"}
Tags: ${o.tags?.join(", ") || "None"}`
    )
    .join("\n");

  return `${MATCHING_SYSTEM}

CANDIDATE PROFILE:
Education: ${profile.education}
Skills: ${profile.skills.join(", ")}
Career Goal: ${profile.careerGoal}
Country: ${profile.country}

PROFILE ANALYSIS:
Summary: ${analysis.summary}
Career Stage: ${analysis.careerStage}
Inferred Skills: ${analysis.inferredSkills.join(", ")}
Experience Level: ${analysis.experienceLevel}
Interests: ${analysis.interests.join(", ")}
Strengths: ${analysis.strengths.join(", ")}
Growth Areas: ${analysis.growthAreas.join(", ")}

AVAILABLE OPPORTUNITIES:
${opportunitiesText}

For each opportunity, evaluate the match and return a ranked list ordered by best fit first.`;
}
