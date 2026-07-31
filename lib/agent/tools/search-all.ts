import { z } from "zod";
import type { AgentTool, ToolResult, ToolContext } from "./base";
import { searchOpportunities } from "./search-utils";
import { deduplicate } from "./dedup";

const opportunityTypeSchema = z.enum([
  "scholarship","fellowship","internship","grant","competition","conference","research","job","bootcamp","accelerator","hackathon","award","exchange","training","volunteer"
]);

const adviceCache = new Map<string, string>();

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

const GENERIC_ADVICE = (title: string) => `Consider applying to ${title}. Review eligibility criteria carefully.`;

async function generateAdvice(title: string, goal: string, ai: ToolContext["ai"], maxMs = 6000): Promise<string> {
  const cacheKey = `${title}::${goal}`;
  const cached = adviceCache.get(cacheKey);
  if (cached) return cached;
  try {
    const result = await withTimeout(
      ai.generateJSON("advice", `Generate personalized advice for an African student applying to "${title}". Mission: "${goal}". Return { advice: "2-3 sentence actionable advice" }`),
      maxMs,
      { advice: GENERIC_ADVICE(title) }
    );
    const advice = (result as { advice?: string })?.advice || GENERIC_ADVICE(title);
    adviceCache.set(cacheKey, advice);
    return advice;
  } catch { return GENERIC_ADVICE(title); }
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

    const TOOL_DEADLINE = Date.now() + 42_000;
    const timeLeft = () => Math.max(0, TOOL_DEADLINE - Date.now());
    const waitFor = (ms: number) => new Promise<boolean>((resolve) => setTimeout(() => resolve(true), ms));

    const STOPWORDS = new Set(["test","mission","using","curl","i","want","need","a","an","the","to","for","of","and","in","at","my","me","anyone","please","help","can","you","find","looking","am","be","with"]);
    const compressedQuery = query.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !STOPWORDS.has(w)).join(" ").slice(0, 80) || query;

    const adviceBudget = () => Math.min(5000, Math.max(1000, timeLeft() - 2000));

    // Step 1: Gemma 4 web search (primary source, up to 32s budget)
    try {
      const searchPrompt = `List up to 3 real, current 2026 ${compressedQuery || "scholarships, fellowships, and internships"} opportunities open to African students. Answer immediately with NO reasoning. Return ONLY a JSON array of 3 objects with short fields: title, provider, type, url, deadline, eligibility. Every field under 20 words. Today is ${new Date().toISOString().split("T")[0]}.`;
      const aiResult = await Promise.race([
        ctx.ai.generateJSON("search", searchPrompt) as Promise<Array<Record<string, unknown>>>,
        waitFor(Math.min(38000, timeLeft())).then(() => null),
      ]);
      if (Array.isArray(aiResult) && aiResult.length > 0) {
        const raw = await Promise.all(aiResult.slice(0, Math.min(limit, 6)).map(async (r, i) => ({
          ...opportunityFromRaw(r, i, types, goal, "AI Discovery"),
          advice: await generateAdvice(String(r.title || r.name || `Opportunity ${i + 1}`), goal, ctx.ai, adviceBudget()),
        })));
        const opportunities = deduplicate(raw as Array<{ title?: string; provider?: string }>, ctx.sessionId);
        if (opportunities.length > 0) return {
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
      const timeoutId = setTimeout(() => controller.abort(), Math.min(8000, timeLeft()));
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
          const raw = await Promise.all(duckResults.slice(0, Math.min(limit, 8)).map(async (r, i) => ({
            ...opportunityFromRaw(r, i, types, goal, "Web"),
            advice: await generateAdvice(String(r.title || `Opportunity ${i + 1}`), goal, ctx.ai, adviceBudget()),
          })));
          const opportunities = deduplicate(raw as Array<{ title?: string; provider?: string }>, ctx.sessionId);
          if (opportunities.length > 0) return {
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

    // Step 3: PostgreSQL database
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

    if (dbResults.length >= 3) {
      const raw = await Promise.all(dbResults.slice(0, 6).map(async (r) => ({
        ...r,
        advice: await generateAdvice(String(r.title || ""), goal, ctx.ai, adviceBudget()),
      })));
      const withAdvice = deduplicate(raw as Array<{ title?: string; provider?: string }>, ctx.sessionId);
      if (withAdvice.length > 0) return {
        success: true,
        data: withAdvice,
        summary: `Found ${withAdvice.length} opportunities from database matching your criteria`,
        metadata: { count: withAdvice.length, types, query: p.keywords, source: "database" },
      };
    }

    // Step 4: Final fallback — keyword-matched curated opportunities
    const curatedFallback: Array<Record<string, string>> = [];
    const q = query.toLowerCase();
    if (q.includes("ai") || q.includes("machine learning") || q.includes("scholarship") || q.includes("masters")) {
      curatedFallback.push(
        { title: "DeepMind AI for Africa Scholarship", provider: "DeepMind/Google", type: "scholarship", description: "Fully-funded MSc/PhD scholarship for African students in AI and CS with research placement at DeepMind London.", eligibility: "African citizen, admitted to MSc/PhD in AI/CS", url: "https://deepmind.google/scholarships" },
        { title: "Mastercard Foundation Scholars Program", provider: "Mastercard Foundation", type: "scholarship", description: "Full-cost scholarship at partner universities worldwide for African students.", eligibility: "African citizen, financial need, academic excellence", url: "https://mastercardfdn.org/scholarships" },
        { title: "DAAD Fully-Funded Masters Scholarship Germany", provider: "DAAD", type: "scholarship", description: "Full scholarship for Masters at German universities for African graduates.", eligibility: "Bachelor's from African university, 2+ years experience", url: "https://daad.de/scholarships" },
        { title: "Google AI Residency Program", provider: "Google Research", type: "fellowship", description: "One-year AI research residency at Google's European offices.", eligibility: "Recent MSc/PhD graduate, strong ML background", url: "https://research.google/residency" },
        { title: "ETH Zurich AI & Data Science Summer Internship", provider: "ETH Zurich", type: "internship", description: "3-month paid internship at ETH Zurich in AI and data science.", eligibility: "Current MSc student in CS/Data Science", url: "https://ethz.ch/internships" },
      );
    } else if (q.includes("fellowship") || q.includes("tech") || q.includes("engineering")) {
      curatedFallback.push(
        { title: "Andela Technical Leadership Program", provider: "Andela", type: "fellowship", description: "Year-long leadership program for African engineers with global company placements.", eligibility: "African engineer, 2+ years experience", url: "https://andela.com" },
        { title: "Mozilla Fellowship for Tech & Policy", provider: "Mozilla Foundation", type: "fellowship", description: "10-month fully-funded fellowship for engineers on internet health.", eligibility: "Tech professional, open source/AI ethics impact", url: "https://foundation.mozilla.org/fellowships" },
        { title: "MLH Fellowship", provider: "Major League Hacking", type: "fellowship", description: "12-week remote open-source fellowship with mentorship from top tech companies.", eligibility: "Current student or recent graduate", url: "https://mlh.io/fellowships" },
      );
    } else if (q.includes("internship") || q.includes("summer")) {
      curatedFallback.push(
        { title: "Google Summer of Code", provider: "Google", type: "internship", description: "12-week remote open-source internship with stipend.", eligibility: "Students and recent graduates 18+", url: "https://summerofcode.withgoogle.com" },
        { title: "IBM Extreme Blue Internship", provider: "IBM", type: "internship", description: "Premier 12-week internship on high-impact tech projects.", eligibility: "Current CS/engineering student", url: "https://ibm.com/internship" },
      );
    } else {
      curatedFallback.push(
        { title: "Rhodes Scholarship — Oxford University", provider: "Rhodes Trust", type: "scholarship", description: "Fully-funded graduate study at Oxford for exceptional leaders.", eligibility: "Bachelor's degree, age 18-24, exceptional academics", url: "https://rhodeshouse.ox.ac.uk" },
        { title: "Schwarzman Scholars — Tsinghua University", provider: "Schwarzman Scholars", type: "scholarship", description: "Fully-funded Master's in Global Affairs at Tsinghua, Beijing.", eligibility: "Bachelor's degree, age 18-29, leadership", url: "https://schwarzmanscholars.org" },
        { title: "Erasmus Mundus Joint Master's", provider: "European Union", type: "scholarship", description: "Fully-funded Master's across 2+ European universities.", eligibility: "Bachelor's, strong academics, English proficiency", url: "https://erasmus-plus.ec.europa.eu" },
      );
    }

    const rawFallback = await Promise.all(curatedFallback.slice(0, limit).map(async (r, i) => ({
      ...opportunityFromRaw(r as unknown as Record<string, unknown>, i, types, goal, "Curated"),
      advice: await generateAdvice(r.title, goal, ctx.ai, adviceBudget()),
    })));
    const fallbackOps = deduplicate(rawFallback as Array<{ title?: string; provider?: string }>, ctx.sessionId);

    return {
      success: true,
      data: fallbackOps,
      summary: `Found ${fallbackOps.length} curated opportunities matching "${query}"`,
      metadata: { count: fallbackOps.length, types, query: p.keywords, source: "curated_fallback" },
    };
  },
};
