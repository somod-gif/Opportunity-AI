# Opportunity AI — Autonomous Agent for African Opportunities

Autonomous AI agent for the "Build with Gemma: AI for Africa Hackathon 2026". Targets **Best Autonomous AI Agent** ($250).

## Architecture

```
Agent Loop (6 iterations max, 3 min timeout)
  Perceive → Reason → Plan → Tool Select → Execute → Observe → Memory
     ↓
  SSE streamed to UI in real-time

Tools:
  search_opportunities — DuckDuckGo API → PostgreSQL DB → curated fallback (3-tier)
  web_search          — DuckDuckGo API + keyword-matched fallback
  analyze_eligibility  — Gemma 4 evaluates candidate fit
  generate_document    — Cover letter, resume, personal statement, checklist via Gemma 4
  rank_opportunities   — Score and sort by match quality
  memory_recall/store  — Episodic/semantic/procedural memory via PostgreSQL
  set_reminder         — Deadline tracking
  rank_opportunities   — Sort by match score
```

## Tech Stack

| Category | Choice |
|----------|--------|
| Framework | Next.js 16.2.12 (App Router) |
| Language | TypeScript 5.x (strict mode) |
| UI | React 19.2.4 + Tailwind CSS v4 |
| Components | shadcn/ui (Radix-Nova) |
| AI | Gemma 4 (gemma-4-26b-a4b-it) via OpenRouter |
| Database | PostgreSQL (Neon) + Drizzle ORM |
| Streaming | Server-Sent Events |
| Icons | lucide-react |
| Animations | Framer Motion |

## File Structure

```
lib/agent/
  engine.ts          — AutonomousAgent class (loop, phases, orchestration)
  types.ts           — AgentState, AgentPhase, SSEEvent
  emit.ts            — SSEEmitter (SSE streaming)
  mission.ts         — Mission parsing + validation
  memory.ts          — AgentMemory (DB-backed read/write/recall)

  tools/
    index.ts         — Barrel exports
    base.ts          — AgentTool interface, ToolContext, ToolResult, AIAdapter
    registry.ts      — ToolRegistry (name → tool lookup)
    search-all.ts    — search_opportunities tool (3-tier: DuckDuckGo → DB → fallback)
    web.ts           — web_search tool (DuckDuckGo API + curated fallback)
    eligibility.ts   — analyze_eligibility tool (Gemma 4 analysis)
    rank.ts          — rank_opportunities tool
    document.ts      — generate_document tool (AI-generated docs)
    memory.ts        — memory_recall + memory_store tools
    notify.ts        — set_reminder tool
    search-utils.ts  — PostgreSQL search utilities

lib/ai/
  client.ts          — AI client with streaming support
  provider.ts        — Base provider interface
  registry.ts        — Provider registry
  gemma-provider.ts  — Gemma 4 via OpenRouter

app/
  page.tsx           — Landing page (hero, features, agent explanation)
  mission/page.tsx   — Mission input page
  agent/[sessionId]/page.tsx — Agent execution screen (SSE stream)
  workspace/[sessionId]/page.tsx — Opportunity workspace
  dashboard/[sessionId]/page.tsx — Mission dashboard
  memory/[sessionId]/page.tsx    — Agent memory viewer
  api/agent/[sessionId]/stream/route.ts — SSE endpoint
```

## Key Decisions

| Decision | Choice |
|----------|--------|
| Opportunity sourcing | DuckDuckGo API → PostgreSQL DB → curated fallback (all with AI advice) |
| Advice | Gemma 4 generates per-opportunity advice at runtime |
| Streaming | SSE via Route Handler |
| Agent timeout | 3 min hard cap, 6 iteration max |
| Tool timeout | 30s per tool via Promise.race |
| Memory | 3 types (episodic/semantic/procedural), importance-ranked |
| Styling | Dark theme with gold/emerald accents |

## Env Vars

```env
OPENROUTER_API_KEY=sk-or-v1-...
DATABASE_URL=postgresql://...
```

## Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run seed         # Seed database with opportunities
```
