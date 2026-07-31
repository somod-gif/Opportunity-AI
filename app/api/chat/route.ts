import { getProvider } from "@/lib/ai/registry";

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || "";
const OR_BASE = (process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1").replace(/\/+$/, "");
const OR_MODEL = process.env.OPENROUTER_MODEL || "google/gemma-4-31b-it:free";
const DDG_API = "https://api.duckduckgo.com";

const SYSTEM = `You are Opportunity AI's in-app support agent. You know the platform inside out.

## Platform Overview
Opportunity AI is an autonomous multi-agent AI system powered by Google Gemma 4. It independently plans, searches, evaluates, and generates applications for African scholarships, fellowships, grants, internships, and career opportunities.

## Pages
- **Landing page** (/) — Hero with mission input, agent pipeline animation, features, and "For judges" info
- **Mission page** (/mission) — Form to launch a new agent mission (goal, education, skills, country, career goal, optional CV)
- **Agent execution** (/agent/[sessionId]) — Live SSE stream showing agent reasoning, tool calls, opportunities found, and documents generated in real-time
- **Dashboard** (/dashboard/[sessionId]) — Mission summary, stats grid, iteration timeline, memory browser, re-run/delete buttons
- **Workspace** (/workspace/[sessionId]) — Discovered opportunities with eligibility analysis, AI advice, apply links, deadline countdowns, document generation
- **Memory viewer** (/memory/[sessionId]) — All stored memories (episodic/semantic/procedural) with edit/delete
- **Mission history** (/history) — List of all past and current missions with status, date, link to each dashboard
- **Quick chat** — The floating chat widget on every page (this chat)

## How Missions Work
1. User enters a goal on the landing page or /mission page
2. A session ID is generated and the user is redirected to /agent/[sessionId]
3. The Multi-Agent Coordinator runs up to 6 iterations (3 min timeout)
4. Each cycle: perceive → reason → plan → tool select → execute → observe → reflect → memory
5. Results stream via SSE in real-time
6. On completion, the user can visit Dashboard, Workspace, or Memory

## Sub-Agents
The mission coordinates 9 specialized agents: Mission Commander, Scholarship Agent, Internship Agent, Grant Agent, Research Agent, Competition Agent, Evaluation Agent, Document Agent, Web Agent.

## Tools
- **search_opportunities** — 4-tier: Gemma 4 AI → DuckDuckGo API → PostgreSQL DB → curated fallback
- **web_search** — DuckDuckGo web search with AI-generated advice per result
- **analyze_eligibility** — Gemma 4 evaluates candidate fit for each opportunity
- **generate_document** — Cover letter, resume, personal statement, checklist, timeline via Gemma 4
- **rank_opportunities** — Score and sort by match quality
- **memory_recall/store** — Episodic/semantic/procedural memory via PostgreSQL
- **set_reminder** — Deadline tracking

## Tech Stack
Next.js 16, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, Gemma 4 via Google AI Studio/OpenRouter, PostgreSQL + Drizzle ORM, SSE streaming, Framer Motion.

## About Gemma 4
The platform uses google/gemma-4-31b-it (Google's open multimodal model). For web search, it uses OpenRouter's web_search plugin or DuckDuckGo API.

Be concise, helpful, and guide users to the right page or feature.`;

function buildPrompt(history: { role: string; content: string }[], message: string) {
  const lines = [`System: ${SYSTEM}`];
  for (const m of (history || [])) {
    lines.push(`${m.role === "assistant" ? "Assistant" : "User"}: ${m.content}`);
  }
  lines.push(`User: ${message}`);
  lines.push("Assistant:");
  return lines.join("\n\n");
}

async function searchViaOpenRouter(message: string, history: { role: string; content: string }[]) {
  const res = await fetch(`${OR_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      "HTTP-Referer": "https://opportunity-ai.vercel.app",
      "X-Title": "Opportunity AI",
    },
    body: JSON.stringify({
      model: OR_MODEL,
      messages: [
        { role: "system", content: SYSTEM + " You have web search capability. Use it to find current opportunities." },
        ...(history || []).filter(m => m.role !== "system").map(m => ({
          role: m.role === "assistant" ? "assistant" as const : "user" as const,
          content: m.content,
        })),
        { role: "user", content: message.replace("/websearch", "").trim() || "Find current opportunities" },
      ],
      plugins: [{ id: "web_search" }],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown error");
    throw new Error(`Search error (${res.status}): ${err}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

async function searchViaDuckDuckGo(query: string) {
  try {
    const res = await fetch(`${DDG_API}/?q=${encodeURIComponent(query + " 2026")}&format=json&no_html=1&skip_disambig=1`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    const topics = data.RelatedTopics || [];
    const results = topics.filter((t: Record<string, unknown>) => t.Text).slice(0, 5).map((t: Record<string, unknown>) => t.Text).join("\n");
    return results || null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();
    if (!message || typeof message !== "string") {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    const wantsSearch = /\/websearch|search|find|opportunit|scholarship|fellowship|scrape/i.test(message);

    if (wantsSearch) {
      if (OPENROUTER_KEY) {
        const text = await searchViaOpenRouter(message, history || []);
        if (text) return Response.json({ response: text, search: true });
      }
      const ddg = await searchViaDuckDuckGo(message.replace("/websearch", "").trim());
      if (ddg) {
        const provider = getProvider();
        const prompt = buildPrompt(history || [], `Web search results for "${message}":\n${ddg}\n\nBased on these results, answer the user's question.`);
        const text = await provider.generate(prompt);
        return Response.json({ response: text || ddg, search: true });
      }
    }

    const provider = getProvider();
    const prompt = buildPrompt(history || [], message);
    const text = await provider.generate(prompt);

    return Response.json({ response: text || "Sorry, I couldn't generate a response.", search: false });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
