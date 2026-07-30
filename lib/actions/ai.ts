"use server";

import { ai } from "@/lib/ai/client";
import type { AgentResult } from "@/lib/ai/agent";
import type { AnalysisInput, GeneratedDocument, ApplicationRoadmap, DocumentType } from "@/lib/ai/prompts";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function analyzeOpportunitiesAction(
  _prev: unknown,
  formData: FormData
): Promise<ActionResult<AgentResult>> {
  try {
    const input: AnalysisInput = {
      name: formData.get("name") as string,
      education: formData.get("education") as string,
      skills: JSON.parse(formData.get("skills") as string) as string[],
      careerGoal: formData.get("careerGoal") as string,
      country: formData.get("country") as string,
    };

    const result = await ai.runAgent(input);

    return { success: true, data: result };
  } catch (error) {
    console.error("Agent failed:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function generateRoadmapAction(
  input: AnalysisInput,
  match: { title: string; whyYouQualify: string[]; gaps: string[]; nextSteps: string[] }
): Promise<ActionResult<ApplicationRoadmap>> {
  try {
    const { db } = await import("@/lib/db");
    const { opportunities } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const opportunity = await db
      .select({
        title: opportunities.title,
        provider: opportunities.provider,
        type: opportunities.type,
        description: opportunities.description,
        eligibilityCriteria: opportunities.eligibilityCriteria,
        deadline: opportunities.deadline,
      })
      .from(opportunities)
      .where(eq(opportunities.isActive, true))
      .then((rows) => rows.find((o) => o.title === match.title));

    if (!opportunity) return { success: false, error: "Opportunity not found." };

    const roadmap = await ai.generateRoadmap(
      input,
      { ...opportunity, deadline: opportunity.deadline ? opportunity.deadline.toISOString() : null },
      { whyYouQualify: match.whyYouQualify, gaps: match.gaps, nextSteps: match.nextSteps }
    );

    return { success: true, data: roadmap };
  } catch (error) {
    console.error("Roadmap generation failed:", error);
    return { success: false, error: "Failed to generate roadmap." };
  }
}

export async function generateDocumentAction(
  type: DocumentType,
  input: AnalysisInput,
  match: { title: string }
): Promise<ActionResult<GeneratedDocument>> {
  try {
    const { db } = await import("@/lib/db");
    const { opportunities } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    const opportunity = await db
      .select({
        title: opportunities.title,
        provider: opportunities.provider,
        type: opportunities.type,
        description: opportunities.description,
        eligibilityCriteria: opportunities.eligibilityCriteria,
        deadline: opportunities.deadline,
      })
      .from(opportunities)
      .where(eq(opportunities.isActive, true))
      .then((rows) => rows.find((o) => o.title === match.title));

    if (!opportunity) return { success: false, error: "Opportunity not found." };

    const doc = await ai.generateDocument(type, input, {
      ...opportunity,
      deadline: opportunity.deadline ? opportunity.deadline.toISOString() : null,
    });

    return { success: true, data: doc };
  } catch (error) {
    console.error("Document generation failed:", error);
    return { success: false, error: "Failed to generate document." };
  }
}

