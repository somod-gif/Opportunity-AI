# Opportunity AI

**Autonomous AI Agent for African Opportunities.** Built for **Build with Gemma: AI for Africa Hackathon 2026**.

A true autonomous AI agent — not a chatbot. You give it a **mission**, it plans, searches the web, queries databases, evaluates eligibility, generates documents, and delivers a complete report — all autonomously.

## How It Works

1. **Describe your mission** — e.g. "Find fully funded AI Master's scholarships in Europe"
2. **Agent takes over** — Plans, searches DuckDuckGo + PostgreSQL, analyzes eligibility via Gemma 4
3. **Watch live** — SSE streams every reasoning step, tool call, and result in real-time
4. **Get results** — Ranked opportunities with AI advice, documents, timeline, and checklist

## Opportunity Sourcing (3-Tier)

| Tier | Source | When |
|------|--------|------|
| 1 | DuckDuckGo Instant Answer API | Always tried first (8s timeout) |
| 2 | PostgreSQL Database | Fallback if web returns nothing |
| 3 | Curated opportunity catalog | Last resort if DB < 3 results |

Every opportunity gets **AI-generated advice** from Gemma 4 at runtime.

## Tech Stack

| Category | Choice |
|----------|--------|
| Framework | Next.js 16.2.12 (App Router) |
| Language | TypeScript 5.x (strict) |
| UI | React 19.2.4 + Tailwind CSS v4 + shadcn/ui |
| AI | Gemma 4 via OpenRouter (`gemma-4-26b-a4b-it:free`) |
| Database | PostgreSQL (Neon) + Drizzle ORM |
| Streaming | Server-Sent Events |
| Agent | 6-iteration max, 3-min timeout, 30s per-tool timeout |

## Quick Start

```bash
npm install
# Set DATABASE_URL and OPENROUTER_API_KEY in .env.local
npm run dev
```

## Project Structure

```
app/                          # Next.js App Router pages
  agent/[sessionId]/          # Live agent execution (SSE stream)
  dashboard/[sessionId]/      # Mission dashboard with charts
  workspace/[sessionId]/      # Opportunity grid
  memory/[sessionId]/         # Agent memory viewer
  api/agent/[sessionId]/stream/ # SSE endpoint

lib/
  agent/                      # Core agent loop + tools
    engine.ts                 # Autonomous agent orchestrator
    tools/                    # 9 tools (search, web, eligibility, document, etc.)
    emit.ts                   # SSE streaming
    memory.ts                 # DB-backed memory
  ai/                         # Gemma 4 integration
  db/                         # PostgreSQL schema + client
```
