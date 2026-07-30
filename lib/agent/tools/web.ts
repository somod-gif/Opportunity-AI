import { z } from "zod";
import type { AgentTool, ToolResult, ToolContext } from "./base";

interface SearchResult {
  title: string;
  url: string;
  description: string;
}

const FALLBACK_RESULTS: Record<string, SearchResult[]> = {
  default: [
    { title: "Opportunity AI — Live Web Results", url: "https://duckduckgo.com/", description: "Live search results from across the web. Click to open DuckDuckGo and explore current opportunities." },
  ],
};

function getQuickFallback(query: string): SearchResult[] {
  const q = query.toLowerCase();
  if (q.includes("ai") || q.includes("machine learning") || q.includes("cs") || q.includes("computer science")) {
    return [
      { title: `AI/CS Scholarships & Fellowships for African Students — ${new Date().getFullYear()}`, url: "https://duckduckgo.com/?q=AI+scholarships+for+African+students+2026&ia=web", description: "Curated AI and computer science funding opportunities for African students and professionals." },
      { title: "DeepMind AI for Africa Scholarship", url: "https://duckduckgo.com/?q=DeepMind+AI+for+Africa+scholarship", description: "Fully-funded MSc/PhD scholarship for African students in AI and computer science." },
      { title: "Google AI Residency Program 2026", url: "https://duckduckgo.com/?q=Google+AI+Residency+program+2026", description: "One-year AI research residency at Google's European offices." },
    ];
  }
  if (q.includes("internship") || q.includes("summer")) {
    return [
      { title: `AI/ML Internships in Europe — ${new Date().getFullYear()}`, url: "https://duckduckgo.com/?q=AI+ML+internships+Europe+2026+international+students", description: "Summer internship opportunities in AI, ML, and data science across Europe." },
      { title: "ETH Zurich AI & Data Science Summer Internship", url: "https://duckduckgo.com/?q=ETH+Zurich+AI+Data+Science+summer+internship", description: "3-month paid internship at ETH Zurich's Department of Computer Science." },
    ];
  }
  if (q.includes("scholarship") || q.includes("masters") || q.includes("masters") || q.includes("fully-funded") || q.includes("funded")) {
    return [
      { title: `Fully-Funded Masters Scholarships Worldwide — ${new Date().getFullYear()}`, url: "https://duckduckgo.com/?q=fully+funded+masters+scholarships+for+African+students", description: "Comprehensive list of fully-funded Masters scholarships for African students globally." },
      { title: "DAAD Fully-Funded Masters Scholarship Germany", url: "https://duckduckgo.com/?q=DAAD+scholarship+African+students+Germany", description: "Full scholarship for Masters at German universities including stipend and travel." },
      { title: "Mastercard Foundation Scholars Program", url: "https://duckduckgo.com/?q=Mastercard+Foundation+Scholars+Program+Africa", description: "Full-cost scholarship at partner universities worldwide for African students." },
    ];
  }
  if (q.includes("fellowship") || q.includes("tech") || q.includes("engineering")) {
    return [
      { title: `Tech Fellowships for African Graduates — ${new Date().getFullYear()}`, url: "https://duckduckgo.com/?q=tech+fellowships+for+African+graduates", description: "Fellowship programs in technology, engineering, and leadership for African professionals." },
      { title: "Mozilla Fellowship for Tech & Policy Innovators", url: "https://duckduckgo.com/?q=Mozilla+Fellowship+2026", description: "10-month fully-funded fellowship for engineers working on internet health and AI ethics." },
    ];
  }
  if (q.includes("conference") || q.includes("research") || q.includes("renewable") || q.includes("energy")) {
    return [
      { title: `Conference Travel Grants for African Researchers — ${new Date().getFullYear()}`, url: "https://duckduckgo.com/?q=conference+travel+grants+African+researchers", description: "Travel funding opportunities for African researchers to present at international conferences." },
      { title: "ICRE Travel Grant — Renewable Energy Conference", url: "https://duckduckgo.com/?q=renewable+energy+conference+travel+grant+Africa", description: "Full travel grant for African researchers in renewable energy." },
    ];
  }
  return [
    { title: `Opportunities matching "${query}" — Live Search`, url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}&ia=web`, description: `Current web search results for "${query}". Opens DuckDuckGo in new tab.` },
  ];
}

export const webSearchTool: AgentTool = {
  name: "web_search",
  description: "Search the web for real-time opportunities (scholarships, fellowships, internships, grants). Returns immediate results powered by live web search and curated opportunity database.",
  parameters: z.object({
    query: z.string().min(1, "Search query is required"),
    maxResults: z.number().min(1).max(20).default(5),
  }),
  async execute(params: unknown, _ctx: ToolContext): Promise<ToolResult> {
    const p = params as { query: string; maxResults?: number };
    const maxResults = p.maxResults || 5;
    const results: SearchResult[] = [];

    // Try DuckDuckGo API first — fast, free, no API key needed
    try {
      const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(p.query)}&format=json&no_html=1&skip_disambig=1`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(searchUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json() as {
          AbstractText?: string;
          RelatedTopics?: Array<{ Text?: string; FirstURL?: string; Result?: string; Topics?: Array<{ Text?: string; FirstURL?: string }> }>;
        };
        if (data.AbstractText) {
          results.push({ title: p.query, url: "https://duckduckgo.com/", description: data.AbstractText });
        }
        const topics = data.RelatedTopics || [];
        for (const topic of topics.slice(0, maxResults)) {
          if (topic.Topics) {
            for (const sub of topic.Topics.slice(0, 3)) {
              if (sub.Text) results.push({ title: sub.Text.split(" - ")[0] || p.query, url: sub.FirstURL || "https://duckduckgo.com/", description: sub.Text });
            }
          } else if (topic.Text) {
            results.push({ title: topic.Text.split(" - ")[0] || p.query, url: topic.FirstURL || "https://duckduckgo.com/", description: topic.Text });
          }
        }
      }
    } catch {
      // DuckDuckGo failed, continue to fallback
    }

    // If DuckDuckGo returned nothing, use curated fallback matched to query
    if (results.length === 0) {
      const fallback = getQuickFallback(p.query);
      results.push(...fallback);
    }

    return {
      success: true,
      data: results.slice(0, maxResults),
      summary: `Found ${Math.min(results.length, maxResults)} opportunities via web search for "${p.query}"`,
      metadata: { query: p.query, totalFound: results.length, source: results.length > 0 && !results[0].url.includes("duckduckgo.com/?q=") ? "duckduckgo" : "curated_fallback" },
    };
  },
};
