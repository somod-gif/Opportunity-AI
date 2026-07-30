import { z } from "zod";
import type { AgentTool, ToolResult, ToolContext } from "./base";

const docTypeSchema = z.enum(["resume", "cover_letter", "personal_statement", "checklist", "timeline"]);

const resumePrompt = (p: Record<string, unknown>) => `Generate a professional ATS-optimized resume for:
OPPORTUNITY: ${p.opportunityTitle}
PROVIDER: ${p.opportunityProvider}
DESCRIPTION: ${p.opportunityDescription}
KEY SKILLS NEEDED: ${(p.opportunitySkills as string[])?.join(", ") || "See description"}
CANDIDATE: Education=${p.profileEducation}, Skills=${(p.profileSkills as string[])?.join(", ")}, Goal=${p.profileCareerGoal || "N/A"}, Country=${p.profileCountry || "N/A"}
Return JSON with: contact {name,email,phone,location}, summary, education[], skills[], experience[], projects[], certifications[], tailoringNotes`;

const coverLetterPrompt = (p: Record<string, unknown>) => `Write a compelling cover letter for:
OPPORTUNITY: ${p.opportunityTitle}
PROVIDER: ${p.opportunityProvider}
TYPE: ${p.opportunityType}
DESCRIPTION: ${p.opportunityDescription}
CANDIDATE: Education=${p.profileEducation}, Skills=${(p.profileSkills as string[])?.join(", ")}, Goal=${p.profileCareerGoal || "N/A"}, Country=${p.profileCountry || "N/A"}
Return JSON with: salutation, introduction, body[], closing, signOff, tailoringNotes`;

const personalStatementPrompt = (p: Record<string, unknown>) => `Write a compelling personal statement for:
OPPORTUNITY: ${p.opportunityTitle}
PROVIDER: ${p.opportunityProvider}
DESCRIPTION: ${p.opportunityDescription}
CANDIDATE: Education=${p.profileEducation}, Skills=${(p.profileSkills as string[])?.join(", ")}, Goal=${p.profileCareerGoal || "N/A"}, Country=${p.profileCountry || "N/A"}
Return JSON with: title, opening, background, motivation, goals, contribution, closing, wordCount, tailoringNotes`;

const checklistPrompt = (p: Record<string, unknown>) => `Generate a detailed application checklist for:
OPPORTUNITY: ${p.opportunityTitle}
PROVIDER: ${p.opportunityProvider}
DESCRIPTION: ${p.opportunityDescription}
ELIGIBILITY: ${p.opportunityEligibility}
DEADLINE: ${p.deadline || "Rolling/Open"}
CANDIDATE: Education=${p.profileEducation}, Goal=${p.profileCareerGoal || "N/A"}
Return JSON with: opportunity, deadline, priority, sections[{name, items[{task,done,notes}]}], totalTasks, tips[]`;

const timelinePrompt = (p: Record<string, unknown>) => `Create an application timeline for ${p.opportunityTitle} at ${p.opportunityProvider}.
Deadline: ${p.deadline ?? "Rolling/Open"}
Complexity: ${p.complexity || "moderate"}
Candidate: Education=${p.profileEducation}, Skills=${(p.profileSkills as string[])?.join(", ") || "N/A"}
Return JSON with: timeline, totalEstimatedHours, phases[{phase,name,tasks[],deadline,hours}], criticalDeadlines[], tips[]`;

const prompts: Record<string, (p: Record<string, unknown>) => string> = {
  resume: resumePrompt,
  cover_letter: coverLetterPrompt,
  personal_statement: personalStatementPrompt,
  checklist: checklistPrompt,
  timeline: timelinePrompt,
};

export const generateDocumentTool: AgentTool = {
  name: "generate_document",
  description: "Generate application documents: resume, cover letter, personal statement, checklist, or timeline",
  parameters: z.object({
    type: docTypeSchema,
    opportunityTitle: z.string(),
    opportunityProvider: z.string(),
    opportunityType: z.string().optional(),
    opportunityDescription: z.string(),
    opportunityEligibility: z.string().optional(),
    opportunitySkills: z.array(z.string()).optional(),
    deadline: z.string().nullable().optional(),
    profileEducation: z.string(),
    profileSkills: z.array(z.string()),
    profileCareerGoal: z.string().optional(),
    profileCountry: z.string().optional(),
    complexity: z.enum(["simple", "moderate", "complex"]).optional(),
  }),
  async execute(params: unknown, ctx: ToolContext): Promise<ToolResult> {
    const p = params as Record<string, unknown>;
    const docType = p.type as string;
    const buildPrompt = prompts[docType];
    if (!buildPrompt) {
      return { success: false, data: null, summary: `Unknown document type: ${docType}` };
    }
    const content = await ctx.ai.generateJSON("document-generation", buildPrompt(p));
    const label = docType.replace(/_/g, " ");
    return {
      success: true,
      data: content,
      summary: `${label.charAt(0).toUpperCase() + label.slice(1)} generated for ${p.opportunityTitle}`,
      metadata: { type: docType, opportunity: p.opportunityTitle },
    };
  },
};
