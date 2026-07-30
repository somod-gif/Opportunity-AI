import { z } from "zod";
import type { AgentTool, ToolResult, ToolContext } from "./base";

export const eligibilityAnalyzerTool: AgentTool = {
  name: "eligibility_analyzer",
  description: "Analyze eligibility for a specific opportunity given a candidate profile. Returns detailed match analysis.",
  parameters: z.object({
    opportunityTitle: z.string(),
    opportunityDescription: z.string(),
    opportunityEligibility: z.string(),
    profileEducation: z.string(),
    profileSkills: z.array(z.string()),
    profileCountry: z.string(),
    profileExperience: z.string().optional(),
  }),
  async execute(params: unknown, ctx: ToolContext): Promise<ToolResult> {
    const p = params as { opportunityTitle: string; opportunityDescription: string; opportunityEligibility: string; profileEducation: string; profileSkills: string[]; profileCountry: string; profileExperience?: string };
    const result = await ctx.ai.generateJSON("eligibility-analysis",
      `Analyze eligibility for "${p.opportunityTitle}"

OPPORTUNITY:
Description: ${p.opportunityDescription}
Eligibility Criteria: ${p.opportunityEligibility}

CANDIDATE PROFILE:
Education: ${p.profileEducation}
Skills: ${p.profileSkills.join(", ")}
Country: ${p.profileCountry}
${p.profileExperience ? `Experience: ${p.profileExperience}` : ""}

Evaluate:
1. Does the candidate meet the eligibility criteria?
2. What specific requirements are met?
3. What requirements are missing or unclear?
4. Overall eligibility score (0-100)
5. Recommendations to improve eligibility

Return JSON:
{
  "eligible": bool,
  "score": number,
  "metRequirements": ["requirement1"],
  "missingRequirements": ["requirement2"],
  "recommendations": ["recommendation1"],
  "notes": "Additional context about eligibility"
}`
    );
    return {
      success: true,
      data: result,
      summary: `Eligibility score: ${(result as Record<string, unknown>)?.score ?? "N/A"}/100`,
      metadata: { score: (result as Record<string, unknown>)?.score },
    };
  },
};
