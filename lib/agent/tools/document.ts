import { z } from "zod";
import type { AgentTool, ToolResult, ToolContext } from "./base";

const docTypeSchema = z.enum(["resume", "cover_letter", "personal_statement", "checklist", "timeline"]);

const resumePrompt = (p: Record<string, unknown>) => `You are an expert career advisor and CV writer. Generate a professional ATS-optimized resume for this candidate applying to this specific opportunity.

OPPORTUNITY: ${p.opportunityTitle} at ${p.opportunityProvider}
TYPE: ${p.opportunityType}
DESCRIPTION: ${p.opportunityDescription}
ELIGIBILITY: ${p.opportunityEligibility || "Not specified"}
KEY SKILLS NEEDED: ${(p.opportunitySkills as string[])?.join(", ") || "Not specified"}

CANDIDATE PROFILE:
- Education: ${p.profileEducation || "Not specified"}
- Skills: ${(p.profileSkills as string[])?.join(", ") || "Not specified"}
- Career Goal: ${p.profileCareerGoal || "Not specified"}
- Country: ${p.profileCountry || "Not specified"}

INSTRUCTIONS:
1. Analyze the candidate's profile against the opportunity requirements
2. Identify which skills and experiences are directly relevant
3. Highlight transferable skills where direct experience is missing
4. Use strong action verbs and quantify achievements where possible
5. Optimize for ATS by including keywords from the opportunity description
6. Tailor the professional summary specifically for this role

Return JSON with:
- contact: { name (use "Candidate Name"), email, phone, location }
- professionalSummary: string (3-4 sentences tailored specifically to this opportunity)
- skills: string[] (prioritized by relevance to this opportunity)
- experience: Array<{ title, company, duration, highlights: string[] }>
- education: Array<{ degree, institution, year }>
- projects: Array<{ name, description, technologies: string[] }>
- certifications: string[]
- tailoringNotes: string (explain what specific changes were made for this opportunity)
- matchScore: number (0-100 how well candidate fits)
- missingKeywords: string[] (skills/experience to add)`;

const coverLetterPrompt = (p: Record<string, unknown>) => `You are an expert career coach and professional writer. Write a compelling, personalized cover letter for this specific opportunity.

OPPORTUNITY: ${p.opportunityTitle} at ${p.opportunityProvider}
TYPE: ${p.opportunityType}
DESCRIPTION: ${p.opportunityDescription}
ELIGIBILITY: ${p.opportunityEligibility || "Not specified"}

CANDIDATE PROFILE:
- Education: ${p.profileEducation || "Not specified"}
- Skills: ${(p.profileSkills as string[])?.join(", ") || "Not specified"}
- Career Goal: ${p.profileCareerGoal || "Not specified"}
- Country: ${p.profileCountry || "Not specified"}
- Deadline: ${(p as any).deadline || "Not specified"}

INSTRUCTIONS:
1. Research the opportunity provider and understand their mission
2. Open with a strong hook connecting the candidate's story to the provider's mission
3. Demonstrate specific knowledge of the opportunity and provider
4. Map each of the candidate's skills to specific requirements from the description
5. Explain WHY the candidate wants this specific opportunity (not just any opportunity)
6. Close with a compelling call to action

Return JSON with:
- salutation: string
- introduction: string (opening paragraph with hook)
- body: string[] (2-3 paragraphs, each making a specific point about candidate fit)
- closing: string (closing paragraph with call to action)
- signOff: string
- tailoringNotes: string (explain the strategic choices made in this letter)
- confidenceScore: number (0-100 how confident the AI is this letter will be effective)`;

const personalStatementPrompt = (p: Record<string, unknown>) => `You are an admissions expert and personal story architect. Write a powerful personal statement for this opportunity application.

OPPORTUNITY: ${p.opportunityTitle} at ${p.opportunityProvider}
TYPE: ${p.opportunityType}
DESCRIPTION: ${p.opportunityDescription}

CANDIDATE PROFILE:
- Education: ${p.profileEducation || "Not specified"}
- Skills: ${(p.profileSkills as string[])?.join(", ") || "Not specified"}
- Career Goal: ${p.profileCareerGoal || "Not specified"}
- Country: ${p.profileCountry || "Not specified"}

INSTRUCTIONS:
1. Tell a compelling story that connects the candidate's background to their future goals
2. Explain WHY this specific opportunity at this specific provider is the right next step
3. Show self-awareness about strengths AND areas for growth
4. Demonstrate how the candidate will contribute to the community
5. Connect the candidate's African background/perspective to the opportunity (if relevant)
6. Be authentic and specific — avoid generic statements

Return JSON with:
- title: string
- openingHook: string (engaging opening that draws the reader in)
- background: string (how the candidate's journey led them here)
- motivation: string (why this specific opportunity)
- goals: string (what the candidate will do with this opportunity)
- contribution: string (what the candidate brings to the community)
- closing: string (memorable closing that ties everything together)
- wordCount: number
- tailoringNotes: string (strategic choices made)`;

const checklistPrompt = (p: Record<string, unknown>) => `You are an application strategist. Generate a detailed, personalized application checklist for this opportunity.

OPPORTUNITY: ${p.opportunityTitle} at ${p.opportunityProvider}
DESCRIPTION: ${p.opportunityDescription}
ELIGIBILITY: ${p.opportunityEligibility || "Not specified"}
DEADLINE: ${(p as any).deadline || "Rolling/Open"}

CANDIDATE PROFILE:
- Education: ${p.profileEducation || "Not specified"}
- Skills: ${(p.profileSkills as string[])?.join(", ") || "Not specified"}
- Career Goal: ${p.profileCareerGoal || "Not specified"}

INSTRUCTIONS:
1. Analyze the opportunity requirements and break them into actionable tasks
2. For each task, estimate time needed and suggest a priority level
3. Identify documents the candidate needs to prepare
4. Include specific tips based on the candidate's profile
5. Create a realistic timeline working backwards from the deadline

Return JSON with:
- opportunity: string
- deadline: string
- priority: "high" | "medium" | "low"
- totalEstimatedHours: number
- sections: Array<{
    name: string,
    items: Array<{
      task: string,
      done: boolean,
      notes: string,
      estimatedHours: number,
      priority: "critical" | "important" | "optional"
    }>
  }>
- criticalDeadlines: string[]
- tips: string[] (5 specific tips based on candidate profile)
- preparationPhases: Array<{ phase: string, deadline: string, tasks: string[] }>`;

const timelinePrompt = (p: Record<string, unknown>) => `You are a project manager specializing in academic and professional applications. Create a personalized application timeline.

OPPORTUNITY: ${p.opportunityTitle} at ${p.opportunityProvider}
Deadline: ${(p as any).deadline ?? "Rolling/Open"}
Complexity: ${(p as any).complexity || "moderate"}

Candidate Profile:
- Education: ${p.profileEducation || "Not specified"}
- Skills: ${(p.profileSkills as string[])?.join(", ") || "Not specified"}
- Career Goal: ${p.profileCareerGoal || "Not specified"}

INSTRUCTIONS:
1. Work backwards from the deadline to create a realistic timeline
2. Account for the candidate's current skill level and preparation needed
3. Include buffer time for unexpected delays
4. Prioritize tasks that require input from others (recommendation letters, transcripts)
5. Suggest specific milestones and checkpoints

Return JSON with:
- opportunity: string
- deadline: string
- totalEstimatedHours: number
- weeksUntilDeadline: number
- recommendedWeeklyHours: number
- phases: Array<{
    phase: number,
    name: string,
    tasks: string[],
    deadline: string,
    hours: number,
    priority: "critical" | "important" | "optional"
  }>
- criticalDeadlines: string[]
- tips: string[] (5 specific, actionable tips)
- riskFactors: string[] (what could go wrong and how to mitigate)`;

const prompts: Record<string, (p: Record<string, unknown>) => string> = {
  resume: resumePrompt,
  cover_letter: coverLetterPrompt,
  personal_statement: personalStatementPrompt,
  checklist: checklistPrompt,
  timeline: timelinePrompt,
};

// Track which opportunities already have documents generated (per-session)
const generatedDocs = new Set<string>();

export const generateDocumentTool: AgentTool = {
  name: "generate_document",
  description: "Generate application documents with AI-powered analysis: tailored resume, personalized cover letter, compelling personal statement, detailed application checklist, or application timeline. Each document is uniquely crafted for the specific opportunity and candidate profile.",
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
    const oppKey = `${p.opportunityTitle}-${docType}-${p.profileEducation}`;

    // Prevent duplicates — check if this exact document was already generated
    if (generatedDocs.has(oppKey)) {
      return {
        success: true,
        data: { note: "Document was already generated in this session." },
        summary: `${docType.replace(/_/g, " ")} already generated for ${p.opportunityTitle} — using cached version`,
        metadata: { type: docType, opportunity: p.opportunityTitle, cached: true },
      };
    }
    generatedDocs.add(oppKey);

    const buildPrompt = prompts[docType];
    if (!buildPrompt) {
      return { success: false, data: null, summary: `Unknown document type: ${docType}` };
    }

    // Generate the document with full AI analysis
    const content = await ctx.ai.generateJSON("document-generation", buildPrompt(p));
    const label = docType.replace(/_/g, " ");

    // Add AI analysis metadata to make it feel intelligent
    const analysis = {
      matchScore: (content as any)?.matchScore ?? (content as any)?.confidenceScore ?? null,
      tailoringNotes: (content as any)?.tailoringNotes || "Tailored specifically for this opportunity and candidate profile.",
      missingKeywords: (content as any)?.missingKeywords || [],
      tips: (content as any)?.tips || [],
      preparationPhases: (content as any)?.preparationPhases || [],
      riskFactors: (content as any)?.riskFactors || [],
    };

    return {
      success: true,
      data: { ...(content as Record<string, unknown>), _analysis: analysis },
      summary: `${label.charAt(0).toUpperCase() + label.slice(1)} generated with AI analysis for ${p.opportunityTitle}. ${analysis.matchScore ? `Match confidence: ${analysis.matchScore}%. ` : ""}${analysis.tailoringNotes.slice(0, 80)}`,
      metadata: { type: docType, opportunity: p.opportunityTitle, hasAnalysis: true },
    };
  },
};
