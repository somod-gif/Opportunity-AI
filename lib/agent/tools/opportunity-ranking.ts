import { z } from "zod";
import type { AgentTool, ToolResult, ToolContext } from "./base";

export const opportunityRankingTool: AgentTool = {
  name: "opportunity_ranking",
  description: "Rank a list of opportunities by match score given a career profile. Uses AI to evaluate fit.",
  parameters: z.object({
    opportunities: z.array(z.object({
      title: z.string(),
      provider: z.string(),
      type: z.string(),
      description: z.string(),
      eligibilityCriteria: z.string(),
      deadline: z.string().nullable(),
      requiredSkills: z.array(z.string()).optional(),
    })),
    profileEducation: z.string(),
    profileSkills: z.array(z.string()),
    profileCountry: z.string(),
    profileCareerGoal: z.string().optional(),
  }),
  async execute(params: unknown, ctx: ToolContext): Promise<ToolResult> {
    const p = params as { opportunities: Array<{ title: string; provider: string; type: string; description: string; eligibilityCriteria: string; deadline: string | null; requiredSkills?: string[] }>; profileEducation: string; profileSkills: string[]; profileCountry: string; profileCareerGoal?: string };
    const oppsText = p.opportunities
      .map((o, i) => `[${i + 1}] ${o.title} (${o.provider}) - ${o.type}
  Description: ${o.description.slice(0, 200)}
  Eligibility: ${o.eligibilityCriteria.slice(0, 200)}
  Required Skills: ${o.requiredSkills?.join(", ") ?? "Not specified"}
  Deadline: ${o.deadline ?? "Rolling"}`)
      .join("\n\n");

    const result = await ctx.ai.generateJSON("opportunity-ranking",
      `Rank these opportunities for the candidate.

CANDIDATE:
Education: ${p.profileEducation}
Skills: ${p.profileSkills.join(", ")}
Country: ${p.profileCountry}
${p.profileCareerGoal ? `Career Goal: ${p.profileCareerGoal}` : ""}

OPPORTUNITIES:
${oppsText}

For each opportunity, evaluate:
1. Match score (0-100) based on skills alignment
2. Competitiveness (low/medium/high)
3. Success probability (0-100)
4. Why the candidate fits
5. Gaps to address

Return JSON:
{
  "rankings": [
    {
      "title": "Opportunity Name",
      "rank": 1,
      "matchScore": 85,
      "competitiveness": "medium",
      "probability": 70,
      "whyFit": "The candidate's AI skills align well...",
      "gaps": ["Missing research experience"],
      "deadlineUrgency": "urgent | moderate | distant"
    }
  ]
}`
    );
    return {
      success: true,
      data: result,
      summary: `Ranked ${p.opportunities.length} opportunities by match score`,
      metadata: { count: p.opportunities.length },
    };
  },
};
