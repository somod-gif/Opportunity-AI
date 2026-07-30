import { z } from "zod";
import type { AgentTool, ToolResult, ToolContext } from "./base";
import { db } from "@/lib/db";
import { opportunities } from "@/lib/db/schema";
import { eq, and, lte, gte } from "drizzle-orm";

const VALID_TYPES = [
  "scholarship", "fellowship", "job", "internship", "grant",
  "accelerator", "competition", "conference", "research", "hackathon",
] as const;

export const deadlineExtractorTool: AgentTool = {
  name: "deadline_extractor",
  description: "Extract deadlines from opportunities, filter by upcoming deadlines within a date range",
  parameters: z.object({
    daysAhead: z.number().min(1).max(365).default(30),
    type: z.string().optional(),
  }),
  async execute(params: unknown, _ctx: ToolContext): Promise<ToolResult> {
    const p = params as { daysAhead?: number; type?: string };
    const daysAhead = p.daysAhead ?? 30;
    const now = new Date();
    const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    const conditions = [
      eq(opportunities.isActive, true),
      gte(opportunities.deadline, now),
      lte(opportunities.deadline, future),
    ];

    if (p.type) {
      const validType = VALID_TYPES.find(t => t === p.type);
      if (validType) {
        conditions.push(eq(opportunities.type, validType));
      }
    }

    const results = await db
      .select({
        title: opportunities.title,
        type: opportunities.type,
        provider: opportunities.provider,
        deadline: opportunities.deadline,
        applicationUrl: opportunities.applicationUrl,
      })
      .from(opportunities)
      .where(and(...conditions))
      .orderBy(opportunities.deadline);

    return {
      success: true,
      data: results,
      summary: `Found ${results.length} opportunities with deadlines in the next ${p.daysAhead} days`,
      metadata: { count: results.length, range: { from: now.toISOString(), to: future.toISOString() } },
    };
  },
};
