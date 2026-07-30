import { OUTPUT_FORMAT_INSTRUCTION } from "./index";
import type { AnalysisInput } from "./index";

const ROADMAP_SYSTEM = `You are an expert application strategist for African talent. Your job is to create a detailed, actionable application roadmap for a candidate pursuing a specific opportunity.

The roadmap must include:
1. A realistic timeline based on the deadline (or 30 days if none)
2. Concrete, sequential steps with deadlines for each
3. Required documents and materials to prepare
4. Tips specific to this opportunity and the candidate's profile
5. A preparation checklist

Be specific and practical. Every step should be something the candidate can actually do.

${OUTPUT_FORMAT_INSTRUCTION}

{
  "timeline": "2-4 weeks before deadline or 30 days",
  "steps": [
    {
      "step": 1,
      "title": "Step title",
      "description": "Detailed instructions",
      "deadline": "YYYY-MM-DD or relative time",
      "estimatedHours": 2
    }
  ],
  "requiredDocuments": [
    "Document name with preparation tips"
  ],
  "preparationTips": [
    "Tip 1",
    "Tip 2"
  ],
  "checklist": [
    "Item 1",
    "Item 2"
  ],
  "estimatedTotalHours": 20
}`;

export function buildRoadmapPrompt(
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
): string {
  return `${ROADMAP_SYSTEM}

CANDIDATE:
Education: ${input.education}
Skills: ${input.skills.join(", ")}
Career Goal: ${input.careerGoal}
Country: ${input.country}

OPPORTUNITY:
Title: ${opportunity.title}
Provider: ${opportunity.provider}
Type: ${opportunity.type}
Description: ${opportunity.description}
Eligibility Criteria: ${opportunity.eligibilityCriteria}
Deadline: ${opportunity.deadline || "Rolling/Open"}

MATCH ANALYSIS:
Why They Qualify: ${matchReasoning.whyYouQualify.join("; ")}
Gaps to Address: ${matchReasoning.gaps.join("; ")}
Recommended Next Steps: ${matchReasoning.nextSteps.join("; ")}

Create a detailed application roadmap tailored to this candidate and opportunity.`;
}
