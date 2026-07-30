import { z } from "zod";
import type { AgentTool, ToolResult, ToolContext } from "./base";

export const gapAnalysisTool: AgentTool = {
  name: "gap_analysis",
  description: "Analyze gaps between a candidate's profile and an opportunity's requirements. Provides actionable improvement suggestions.",
  parameters: z.object({
    opportunityTitle: z.string(),
    opportunityRequirements: z.string(),
    profileSkills: z.array(z.string()),
    profileEducation: z.string(),
    profileExperience: z.string().optional(),
    careerGoal: z.string().optional(),
  }),
  async execute(params: unknown, ctx: ToolContext): Promise<ToolResult> {
    const p = params as { opportunityTitle: string; opportunityRequirements: string; profileSkills: string[]; profileEducation: string; profileExperience?: string; careerGoal?: string };
    const result = await ctx.ai.generateJSON("gap-analysis",
      `Analyze gaps between candidate and opportunity.

OPPORTUNITY: ${p.opportunityTitle}
REQUIREMENTS: ${p.opportunityRequirements}

CANDIDATE:
Education: ${p.profileEducation}
Skills: ${p.profileSkills.join(", ")}
${p.profileExperience ? `Experience: ${p.profileExperience}` : ""}
${p.careerGoal ? `Career Goal: ${p.careerGoal}` : ""}

Identify:
1. Skills gaps (required but missing)
2. Experience gaps
3. Education gaps
4. Document gaps (what needs to be prepared)
5. Timeline gaps (deadline conflicts)
6. Priority actions to close each gap

Return JSON:
{
  "overallGapScore": 35,
  "gaps": [
    {
      "category": "skills | experience | education | documents | timeline",
      "gap": "Missing machine learning experience",
      "severity": "high | medium | low",
      "action": "Complete an online ML course",
      "timeRequired": "2 months",
      "priority": 1
    }
  ],
  "strengths": ["Strong programming background"],
  "summary": "The candidate is a solid match but needs to address 3 key gaps"
}`
    );
    return {
      success: true,
      data: result,
      summary: `Gap analysis complete — ${(result as Record<string, unknown>)?.gaps instanceof Array ? ((result as Record<string, unknown>).gaps as Array<unknown>).length : 0} gaps identified`,
    };
  },
};
