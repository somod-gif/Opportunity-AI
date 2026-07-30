import { z } from "zod";
import type { AgentTool, ToolResult, ToolContext } from "./base";
import { searchOpportunities } from "./search-utils";

const opportunityTypeSchema = z.enum([
  "scholarship","fellowship","internship","grant","competition","conference","research","job","bootcamp","accelerator","hackathon","award","exchange","training","volunteer"
]);

export const searchOpportunitiesTool: AgentTool = {
  name: "search_opportunities",
  description: "Search for educational and career opportunities by type, keywords, country, and deadline",
  parameters: z.object({
    types: z.union([opportunityTypeSchema, z.array(opportunityTypeSchema)]).optional(),
    keywords: z.union([z.string(), z.array(z.string())]).optional(),
    country: z.string().optional(),
    deadlineBefore: z.string().optional(),
    deadlineAfter: z.string().optional(),
    provider: z.string().optional(),
    isRemote: z.boolean().optional(),
    limit: z.number().min(1).max(50).default(20),
    offset: z.number().min(0).optional(),
  }),
      async execute(params: unknown, _ctx: ToolContext): Promise<ToolResult> {
    const p = params as { types?: string | string[]; keywords?: string | string[]; country?: string; deadlineBefore?: string; deadlineAfter?: string; provider?: string; isRemote?: boolean; limit?: number; offset?: number };
    const types = p.types ? (Array.isArray(p.types) ? p.types : [p.types]) : undefined;
    const results = await searchOpportunities({
      types,
      keywords: p.keywords,
      country: p.country,
      deadlineBefore: p.deadlineBefore,
      deadlineAfter: p.deadlineAfter,
      provider: p.provider,
      isRemote: p.isRemote,
      limit: p.limit,
      offset: p.offset,
    });
    return {
      success: true,
      data: results,
      summary: `Found ${results.length} opportunities matching your criteria`,
      metadata: { count: results.length, types, query: p.keywords },
    };
  },
};
