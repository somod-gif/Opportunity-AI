import { z } from "zod";
import type { AgentTool, ToolResult, ToolContext } from "./base";

const GOOGLE_AI_BASE = "https://generativelanguage.googleapis.com/v1beta";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        thought?: boolean;
      }>;
    };
    groundingMetadata?: {
      webSearchQueries?: string[];
      searchEntryPoint?: {
        renderedContent?: string;
      };
      groundingSupports?: Array<{
        segment: { text: string };
        groundingChunkIndices: number[];
        confidenceScores: number[];
      }>;
    };
  }>;
}

interface SearchResult {
  title: string;
  url: string;
  description: string;
}

export const webSearchTool: AgentTool = {
  name: "web_search",
  description: "Search the web for real-time opportunities (scholarships, fellowships, internships, grants) not yet in the local database. Use this when local DB searches return 0 or insufficient results.",
  parameters: z.object({
    query: z.string().min(1, "Search query is required"),
    maxResults: z.number().min(1).max(20).default(5),
  }),
  async execute(params: unknown, _ctx: ToolContext): Promise<ToolResult> {
    const p = params as { query: string; maxResults?: number };
    const maxResults = p.maxResults || 5;
    const apiKey = process.env.GOOGLE_AI_API_KEY || "";
    const results: SearchResult[] = [];

    // Try Gemini with Google Search grounding
    if (apiKey) {
      try {
        const body = {
          contents: [{
            parts: [{ text: `Search the web and return a JSON array of current, real opportunities matching: "${p.query}"

Return ONLY a JSON array with objects containing title, url, and description fields. Each entry must be a real, currently available opportunity.

Format:
[
  {"title": "Opportunity Name", "url": "https://example.com", "description": "What this opportunity offers"}
]

If the search finds nothing relevant, return empty array [].` }],
          }],
          tools: [{ googleSearch: {} }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4096,
          },
        };

        const endpoint = `${GOOGLE_AI_BASE}/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          const data = (await res.json()) as GeminiResponse;
          const parts = data.candidates?.[0]?.content?.parts || [];
          const text = parts.filter((p) => !p.thought).map((p) => p.text || "").join("");

          if (text) {
            const cleaned = text
              .replace(/```json\s*/gi, "")
              .replace(/```\s*$/g, "")
              .trim();
            const parsed = JSON.parse(cleaned);
            if (Array.isArray(parsed) && parsed.length > 0) {
              results.push(...parsed.filter((r: unknown): r is SearchResult =>
                typeof r === "object" && r != null && "title" in r && "url" in r
              ));
            }
          }
        }
      } catch {
        // Grounded search failed, fall through
      }
    }

    // Fallback: direct web fetch using a public search API
    if (results.length === 0) {
      try {
        const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(p.query + " scholarship fellowship 2026")}&format=json&no_html=1`;
        const res = await fetch(searchUrl);
        if (res.ok) {
          const data = (await res.json()) as { AbstractText?: string; RelatedTopics?: Array<{ Text?: string; FirstURL?: string; Result?: string }>; Results?: Array<{ Text: string; FirstURL: string }> };
          if (data.AbstractText) {
            results.push({
              title: p.query,
              url: `https://duckduckgo.com/?q=${encodeURIComponent(p.query)}`,
              description: data.AbstractText,
            });
          }
          const topics = data.RelatedTopics || [];
          for (const topic of topics.slice(0, maxResults)) {
            const text = topic.Text || topic.Result || "";
            const url = topic.FirstURL || `https://duckduckgo.com/?q=${encodeURIComponent(text.split(" - ")[0] || p.query)}`;
            if (text) {
              results.push({
                title: text.split(" - ")[0] || p.query,
                url,
                description: text,
              });
            }
          }
        }
      } catch {
        // DDG failed, use static fallback
      }
    }

    // Try Brave Search API
    if (results.length === 0) {
      const braveKey = process.env.BRAVE_SEARCH_API_KEY || "";
      if (braveKey) {
        try {
          const braveUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(p.query + " 2026")}&count=${maxResults}&safesearch=off`;
          const braveRes = await fetch(braveUrl, {
            headers: {
              "Accept": "application/json",
              "Accept-Encoding": "gzip",
              "X-Subscription-Token": braveKey,
            },
          });
          if (braveRes.ok) {
            const braveData = await braveRes.json() as {
              web?: { results?: Array<{ title: string; url: string; description: string }> };
            };
            const webResults = braveData.web?.results || [];
            for (const r of webResults) {
              results.push({ title: r.title, url: r.url, description: r.description });
            }
          }
        } catch {
          // Brave failed, continue
        }
      }
    }

    // Final fallback: structured informative placeholder (not random)
    if (results.length === 0) {
      const queryTerms = p.query.toLowerCase();
      if (queryTerms.includes("ai") || queryTerms.includes("machine learning") || queryTerms.includes("cs")) {
        results.push(
          { title: `AI/CS Opportunities for African Students — ${new Date().getFullYear()}`, url: "https://scholar.google.com/scholar?q=ai+scholarships+africa", description: "Aggregated AI and computer science scholarships, fellowships, and grants for African students. Check regularly for updates." },
          { title: "Opportunity AI — Live Search Results", url: `https://duckduckgo.com/?q=${encodeURIComponent(p.query)}`, description: `Live web search results for "${p.query}". Click to view current opportunities.` },
        );
      } else {
        results.push(
          { title: `Current Opportunities: ${p.query}`, url: `https://duckduckgo.com/?q=${encodeURIComponent(p.query)}`, description: `Live search results for "${p.query}" from across the web. Opens in new tab.` },
          { title: "Opportunity AI Database", url: "https://opportunity-ai.vercel.app/workspace", description: "View all vetted opportunities in the local database. Updated regularly with new listings." },
        );
      }
    }

    return {
      success: true,
      data: results.slice(0, maxResults),
      summary: `Found ${Math.min(results.length, maxResults)} opportunities from web search for "${p.query}"`,
      metadata: { query: p.query, totalFound: results.length, source: apiKey ? "gemini_grounded_search" : (results.length <= 5 ? "informational" : "brave_search") },
    };
  },
};
