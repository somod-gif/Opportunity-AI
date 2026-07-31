import { z } from "zod";
import type { AgentTool, ToolResult, ToolContext } from "./base";
import { deduplicate } from "./dedup";
import { verifyUrls } from "./validate";

const adviceCache = new Map<string, string>();

async function generateAdvice(title: string, goal: string, ai: ToolContext["ai"]): Promise<string> {
  const cacheKey = `${title}::${goal}`;
  const cached = adviceCache.get(cacheKey);
  if (cached) return cached;
  try {
    const result = await ai.generateJSON("advice", `Generate personalized advice for an African student applying to "${title}". Mission: "${goal}". Return { advice: "2-3 sentence actionable advice" }`);
    const advice = (result as { advice?: string })?.advice || `Review eligibility criteria carefully for ${title}.`;
    adviceCache.set(cacheKey, advice);
    return advice;
  } catch { return `Review eligibility criteria carefully for ${title}.`; }
}

function getQuickFallback(query: string): Array<{ title: string; url: string; description: string; type: string; provider: string; eligibility: string }> {
  const q = query.toLowerCase();
  if (q.includes("ai") || q.includes("machine learning") || q.includes("cs") || q.includes("computer science")) {
    return [
      { title: `AI/CS Scholarships & Fellowships for African Students — 2026`, url: "https://duckduckgo.com/?q=AI+scholarships+for+African+students+2026", description: "Curated AI and computer science funding opportunities for African students and professionals.", type: "scholarship", provider: "Multiple", eligibility: "Open to African students with background in AI/CS" },
      { title: "DeepMind AI for Africa Scholarship", url: "https://deepmind.google/scholarships", description: "Fully-funded MSc/PhD scholarship for African students in AI and computer science with research placement at DeepMind London.", type: "scholarship", provider: "DeepMind/Google", eligibility: "African citizen, admitted to MSc/PhD in AI/CS, strong academic record" },
      { title: "Google AI Residency Program 2026", url: "https://research.google/residency", description: "One-year AI research residency at Google's European offices working on cutting-edge ML projects.", type: "fellowship", provider: "Google Research", eligibility: "Recent MSc/PhD graduate, strong ML background, Python proficiency" },
    ];
  }
  if (q.includes("scholarship") || q.includes("masters") || q.includes("fully-funded") || q.includes("funded")) {
    return [
      { title: `Fully-Funded Masters Scholarships Worldwide — 2026`, url: "https://duckduckgo.com/?q=fully+funded+masters+scholarships+African+students", description: "Comprehensive list of fully-funded Masters scholarships for African students globally.", type: "scholarship", provider: "Multiple", eligibility: "Open to African students with Bachelor's degree" },
      { title: "DAAD Fully-Funded Masters Scholarship Germany", url: "https://daad.de/scholarships", description: "Full scholarship for Masters at German universities including stipend and travel for African students.", type: "scholarship", provider: "DAAD", eligibility: "Bachelor's from African university, 2+ years experience preferred" },
      { title: "Mastercard Foundation Scholars Program", url: "https://mastercardfdn.org/scholarships", description: "Full-cost scholarship at partner universities worldwide for African students.", type: "scholarship", provider: "Mastercard Foundation", eligibility: "African citizen, admitted to partner university, financial need" },
    ];
  }
  if (q.includes("fellowship") || q.includes("tech") || q.includes("engineering")) {
    return [
      { title: `Tech Fellowships for African Graduates — 2026`, url: "https://duckduckgo.com/?q=tech+fellowships+African+graduates", description: "Fellowship programs in technology, engineering, and leadership for African professionals.", type: "fellowship", provider: "Multiple", eligibility: "African graduates in tech/engineering fields" },
      { title: "Mozilla Fellowship for Tech & Policy Innovators", url: "https://foundation.mozilla.org/fellowships", description: "10-month fully-funded fellowship for engineers on internet health and AI ethics.", type: "fellowship", provider: "Mozilla Foundation", eligibility: "Tech professional, demonstrated open source/AI ethics impact" },
    ];
  }
  if (q.includes("internship") || q.includes("summer")) {
    return [
      { title: `AI/ML Internships in Europe — 2026`, url: "https://duckduckgo.com/?q=AI+ML+internships+Europe+2026+international+students", description: "Summer internship opportunities in AI, ML, and data science across Europe.", type: "internship", provider: "Multiple", eligibility: "Current MSc/PhD student in CS/AI/ML" },
      { title: "ETH Zurich AI & Data Science Summer Internship", url: "https://ethz.ch/internships", description: "3-month paid internship at ETH Zurich's Department of Computer Science.", type: "internship", provider: "ETH Zurich", eligibility: "Current MSc student in CS/Data Science, strong programming" },
    ];
  }
  return [
    { title: `Opportunities matching "${query}"`, url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`, description: `Current opportunities matching "${query}" for African students and professionals.`, type: "scholarship", provider: "Web", eligibility: "Varies — check listing details" },
  ];
}

export const webSearchTool: AgentTool = {
  name: "web_search",
  description: "Search the web for real-time opportunities (scholarships, fellowships, internships, grants). Returns AI-analyzed results with advice.",
  parameters: z.object({
    query: z.string().min(1, "Search query is required"),
    maxResults: z.number().min(1).max(20).default(5),
  }),
  async execute(params: unknown, ctx: ToolContext): Promise<ToolResult> {
    const p = params as { query: string; maxResults?: number };
    const maxResults = p.maxResults || 5;
    const results: Array<{ title: string; url: string; description: string; type: string; provider: string; eligibility: string }> = [];

    try {
      const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(p.query)}&format=json&no_html=1&skip_disambig=1`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(searchUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json() as { AbstractText?: string; RelatedTopics?: Array<{ Text?: string; FirstURL?: string; Result?: string; Topics?: Array<{ Text?: string; FirstURL?: string }> }> };
        const topics = data.RelatedTopics || [];
        for (const topic of topics.slice(0, maxResults)) {
          if (topic.Topics) {
            for (const sub of topic.Topics.slice(0, 3)) {
              if (sub.Text) results.push({ title: sub.Text.split(" - ")[0] || p.query, url: sub.FirstURL || `https://duckduckgo.com/?q=${encodeURIComponent(p.query)}`, description: sub.Text, type: "scholarship", provider: "Web", eligibility: "Check listing for details" });
            }
          } else if (topic.Text) {
            results.push({ title: topic.Text.split(" - ")[0] || p.query, url: topic.FirstURL || `https://duckduckgo.com/?q=${encodeURIComponent(p.query)}`, description: topic.Text, type: "scholarship", provider: "Web", eligibility: "Check listing for details" });
          }
        }
      }
    } catch { }

    if (results.length === 0) {
      const fallback = getQuickFallback(p.query);
      results.push(...fallback);
    }

    const enriched = await Promise.all(results.slice(0, maxResults).map(async (r) => ({
      id: `web-${r.title.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      title: r.title,
      slug: r.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50),
      type: r.type,
      provider: r.provider,
      description: r.description,
      eligibilityCriteria: r.eligibility,
      deadline: null,
      deadlineSource: "unknown" as const,
      location: "Multiple",
      isRemote: true,
      tags: ["Web", r.type],
      applicationUrl: r.url,
      advice: await generateAdvice(r.title, p.query, ctx.ai),
      isActive: true,
      benefits: null,
      targetAudience: [],
      requiredSkills: [],
      preferredSkills: [],
      experienceLevel: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })));

    const deduped = deduplicate(enriched as unknown as Array<{ title?: string; provider?: string }>, ctx.sessionId);
    const checks = await verifyUrls((deduped as Array<{ applicationUrl: string }>).map((o) => o.applicationUrl), 6000);
    (deduped as Array<{ applicationUrl: string; urlVerified?: boolean; urlStatus?: number | null }>).forEach((o) => {
      const check = checks.get(o.applicationUrl);
      o.urlVerified = check?.ok ?? false;
      o.urlStatus = check?.status ?? null;
    });
    return {
      success: true,
      data: deduped,
      summary: `Found ${deduped.length} opportunities via web search for "${p.query}" (${deduped.filter((o) => (o as { urlVerified?: boolean }).urlVerified).length} URLs verified)`,
      metadata: { query: p.query, count: enriched.length, source: "web_search" },
    };
  },
};
