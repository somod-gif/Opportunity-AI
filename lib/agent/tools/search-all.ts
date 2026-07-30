import { z } from "zod";
import type { AgentTool, ToolResult, ToolContext } from "./base";
import { searchOpportunities } from "./search-utils";

const opportunityTypeSchema = z.enum([
  "scholarship","fellowship","internship","grant","competition","conference","research","job","bootcamp","accelerator","hackathon","award","exchange","training","volunteer"
]);

async function generateAdvice(title: string, goal: string, ai: ToolContext["ai"]): Promise<string> {
  try {
    const result = await ai.generateJSON("advice", `Generate personalized advice for an African student applying to "${title}". Mission: "${goal}". Return { advice: "2-3 sentence actionable advice" }`);
    return (result as { advice?: string })?.advice || `Consider applying to ${title}. Review eligibility criteria carefully.`;
  } catch { return `Consider applying to ${title}. Review eligibility criteria carefully.`; }
}

function opportunityFromRaw(r: Record<string, unknown>, i: number, types: string[] | undefined, goal: string, source: string): Record<string, unknown> {
  const title = String(r.title || r.name || `Opportunity ${i + 1}`);
  return {
    id: `${source}-${i}-${Date.now()}`,
    title,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50),
    type: String(r.type || (types || ["scholarship"]).find(t => String(r.description || "").toLowerCase().includes(t)) || "scholarship"),
    provider: String(r.provider || r.organization || r.institution || "Web Source"),
    description: String(r.description || ""),
    eligibilityCriteria: String(r.eligibility || r.eligibilityCriteria || "Varies — check the official listing."),
    deadline: String(r.deadline || new Date(Date.now() + 60 * 86400000).toISOString()),
    location: String(r.location || "Multiple"),
    isRemote: true,
    tags: [source, ...(types || []).slice(0, 3)],
    applicationUrl: String(r.url || r.applicationUrl || r.link || ""),
    isActive: true,
    benefits: null,
    targetAudience: [],
    requiredSkills: [],
    preferredSkills: [],
    experienceLevel: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

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
  async execute(params: unknown, ctx: ToolContext): Promise<ToolResult> {
    const p = params as { types?: string | string[]; keywords?: string | string[]; country?: string; deadlineBefore?: string; deadlineAfter?: string; provider?: string; isRemote?: boolean; limit?: number; offset?: number };
    const types = p.types ? (Array.isArray(p.types) ? p.types : [p.types]) : undefined;
    const query = Array.isArray(p.keywords) ? p.keywords.join(" ") : p.keywords || "";
    const goal = query;
    const limit = p.limit || 20;

    // Step 1: Gemma 4 web search via OpenRouter (primary source)
    try {
      const searchPrompt = `Search the web for current ${query || "scholarships, fellowships, and internships"} opportunities for African students. Return a JSON array of objects with: title, description, provider, type (scholarship/fellowship/internship/grant), url, eligibility, location, deadline if known. Return up to ${limit} real opportunities from actual web sources. Today is ${new Date().toISOString().split("T")[0]}.`;
      const aiResult = await ctx.ai.generateJSON("search", searchPrompt) as Array<Record<string, unknown>>;
      if (Array.isArray(aiResult) && aiResult.length > 0) {
        const opportunities = await Promise.all(aiResult.slice(0, limit).map(async (r, i) => ({
          ...opportunityFromRaw(r, i, types, goal, "AI Discovery"),
          advice: await generateAdvice(String(r.title || r.name || `Opportunity ${i + 1}`), goal, ctx.ai),
        })));
        return {
          success: true,
          data: opportunities,
          summary: `Found ${opportunities.length} opportunities via Gemma 4 web search matching "${query}"`,
          metadata: { count: opportunities.length, types, query: p.keywords, source: "gemma4_websearch" },
        };
      }
    } catch {
      // Gemma web search failed, try DuckDuckGo
    }

    // Step 2: DuckDuckGo API (secondary source)
    try {
      const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query + " scholarship fellowship opportunity 2026")}&format=json&no_html=1&skip_disambig=1`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(searchUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json() as {
          AbstractText?: string;
          RelatedTopics?: Array<{ Text?: string; FirstURL?: string; Result?: string; Topics?: Array<{ Text?: string; FirstURL?: string }> }>;
        };

        const duckResults: Array<Record<string, unknown>> = [];
        const topics = data.RelatedTopics || [];
        for (const topic of topics.slice(0, Math.min(limit, 15))) {
          if (topic.Topics) {
            for (const sub of topic.Topics.slice(0, 3)) {
              if (sub.Text) duckResults.push({ title: sub.Text.split(" - ")[0] || query, description: sub.Text, url: sub.FirstURL });
            }
          } else if (topic.Text) {
            duckResults.push({ title: topic.Text.split(" - ")[0] || query, description: topic.Text, url: topic.FirstURL });
          }
        }

        if (duckResults.length > 0) {
          const opportunities = await Promise.all(duckResults.slice(0, limit).map(async (r, i) => ({
            ...opportunityFromRaw(r, i, types, goal, "Web"),
            advice: await generateAdvice(String(r.title || `Opportunity ${i + 1}`), goal, ctx.ai),
          })));
          return {
            success: true,
            data: opportunities,
            summary: `Found ${opportunities.length} opportunities via web search matching "${query}"`,
            metadata: { count: opportunities.length, types, query: p.keywords, source: "duckduckgo" },
          };
        }
      }
    } catch {
      // DuckDuckGo failed, try DB
    }

    // Step 3: PostgreSQL database (last resort)
    const dbResults = await searchOpportunities({
      types,
      keywords: p.keywords,
      country: p.country,
      deadlineBefore: p.deadlineBefore,
      deadlineAfter: p.deadlineAfter,
      provider: p.provider,
      isRemote: p.isRemote,
      limit,
      offset: p.offset,
    });

    const withAdvice = await Promise.all(dbResults.map(async (r) => ({
      ...r,
      advice: await generateAdvice(String(r.title || ""), goal, ctx.ai),
    })));

    return {
      success: true,
      data: withAdvice,
      summary: `Found ${dbResults.length} opportunities from database matching your criteria`,
      metadata: { count: dbResults.length, types, query: p.keywords, source: "database" },
    };
  },
};
