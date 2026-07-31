# Opportunity AI — Autonomous Agent for African Opportunities

Autonomous AI agent for the "Build with Gemma: AI for Africa Hackathon 2026". Targets **Best Autonomous AI Agent** ($250).

## Architecture

```
Agent Loop (6 iterations max, 3 min timeout)
  Perceive → Reason → Plan → Tool Select → Execute → Observe → Memory
     ↓
  SSE streamed to UI in real-time

Tools:
  search_opportunities — Gemma 4 web search → DuckDuckGo API → PostgreSQL DB → curated (3-tier)
  web_search          — Gemma 4 web_search plugin + DuckDuckGo fallback
  analyze_eligibility  — Gemma 4 evaluates candidate fit
  generate_document    — Cover letter, resume, personal statement, checklist via Gemma 4
  rank_opportunities   — Score and sort by match quality
  gap_analysis         — Skill gaps + learning path via Gemma 4
  memory_recall/store  — Episodic/semantic/procedural memory via PostgreSQL
  set_reminder         — Deadline tracking (email_reminder via Resend)
```

## Tech Stack

| Category | Choice |
|----------|--------|
| Framework | Next.js 16.2.12 (App Router) |
| Language | TypeScript 5.x (strict mode) |
| UI | React 19.2.4 + Tailwind CSS v4 |
| Components | shadcn/ui (Radix-Nova) |
| AI | Gemma 4 (gemma-4-31b-it) via Google AI Studio |
| Database | PostgreSQL (Neon) + Drizzle ORM |
| Streaming | Server-Sent Events |
| Icons | lucide-react |
| Animations | Framer Motion |
| Email | Resend (reminders) |

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
  registry.ts        — Provider registry (default: gemma)
  gemma-provider.ts  — Gemma 4 via Google AI Studio (function calling)
  openrouter-provider.ts — OpenRouter fallback provider

app/
  page.tsx           — Landing page (hero, features, agent explanation)
  mission/page.tsx   — Mission input page
  agent/[sessionId]/page.tsx — Agent execution screen (SSE stream)
  workspace/[sessionId]/page.tsx — Opportunity workspace
  dashboard/[sessionId]/page.tsx — Mission dashboard
  memory/[sessionId]/page.tsx    — Agent memory viewer
  applications/[sessionId]/      — Application Kanban tracker
  opportunity/[sessionId]/[slug] — AI-scored opportunity detail
  report/[sessionId]/            — Printable mission report
  settings/[sessionId]/          — System status + reminder preferences
  history/                       — Mission history
  api/agent/[sessionId]/stream/route.ts — SSE endpoint
  api/chat/route.ts              — AI assistant with web search
  api/reminders/route.ts         — Reminders + Resend email
  api/missions/route.ts          — Mission history API
```

## Key Decisions

| Decision | Choice |
|----------|--------|
| Opportunity sourcing | Gemma 4 web search → DuckDuckGo API → PostgreSQL DB → curated fallback (all with AI advice) |
| Advice | Gemma 4 generates per-opportunity advice at runtime |
| Streaming | SSE via Route Handler |
| Agent timeout | 3 min hard cap, 6 iteration max |
| Tool timeout | 30s per tool via Promise.race |
| Memory | 3 types (episodic/semantic/procedural), importance-ranked |
| Styling | Dark theme with gold/emerald accents |

## Env Vars

```env
GOOGLE_AI_API_KEY=...          # Google AI Studio (primary)
AI_PROVIDER=gemma              # gemma (default) | openrouter
AI_MODEL=gemma-4-31b-it
DATABASE_URL=postgresql://...  # Neon
RESEND_API_KEY=...             # Email reminders (optional)
```

## Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run seed         # Seed database with opportunities
```
