# Opportunity AI

**Autonomous AI Career Intelligence Agent for Africa — powered by Gemma 4**

Built for **Build with Gemma: AI for Africa Hackathon 2026** · Targets **Best Autonomous AI Agent**

Opportunity AI is **not a chatbot** and **not a search engine**. It is a multi-agent autonomous platform: you give it a single **mission**, and Gemma 4 plans, reasons, calls tools, searches the web, evaluates eligibility, ranks opportunities, generates application documents, sets reminders, and delivers a complete mission report — all on its own, streamed live to your screen.

---

## Problem Statement

African students and early-career professionals are massively underserved when it comes to discovering global opportunities:

- **Fragmented sources** — scholarships, internships, fellowships and grants are scattered across hundreds of portals, PDFs, and mailing lists.
- **Missed deadlines** — there is no central, deadline-aware tracking system.
- **Generic applications** — candidates lack personalized documents (CVs, cover letters, statements) tuned to each opportunity.
- **No eligibility clarity** — candidates waste weeks applying to opportunities they do not qualify for.

Opportunity AI replaces this manual, error-prone workflow with an autonomous AI employee that does the discovery, eligibility analysis, document generation, and deadline tracking on the user's behalf.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js 16 App Router (TypeScript, Tailwind v4)            │
│  app/agent/[sessionId]  ←─ SSE live stream ──  API route    │
└───────────────┬──────────────────────────────┬──────────────┘
                │                              │
        ┌───────▼────────┐            ┌────────▼─────────┐
        │   AI Core      │            │   PostgreSQL     │
        │  (Gemma 4)     │            │  (Neon + Drizzle)│
        └───────┬────────┘            └────────▲─────────┘
                │                              │
    ┌───────────▼──────────────────────────────┘
    │  Multi-Agent Loop (max 6 iterations, 3 min)
    │  Perceive → Reason → Plan → Tool Select
    │  → Execute → Observe → Reflect → Memory
    └───────┬──────────────────────────────────
            │  Tools (Gemma function calling)
            ├─ search_opportunities  (web → DB → curated)
            ├─ web_search            (Gemma web_search plugin)
            ├─ analyze_eligibility   (Gemma evaluates fit)
            ├─ rank_opportunities    (scoring + sorting)
            ├─ generate_document     (CV, cover letter, checklist)
            ├─ gap_analysis          (skill gaps + learning path)
            ├─ email_reminder        (Resend emails)
            ├─ memory_recall/store   (episodic/semantic/procedural)
            └─ set_reminder          (deadline tracking)
```

### Multi-Agent Design

The agent loop is orchestrated by a **Mission Commander** with specialized sub-agents:

| Agent | Responsibility |
|---|---|
| **Mission Commander** | Mission understanding, planning, orchestration, final report |
| **Search Agent** | Sources opportunities via Gemma 4 web search → PostgreSQL → curated fallback |
| **Evaluation Agent** | Eligibility analysis against the user's profile |
| **Ranking Agent** | Match scoring and sorting by quality |
| **Document Agent** | Cover letters, CVs, personal statements, checklists, timelines |
| **Reflection Agent** | Confidence scoring, skill gap analysis, proactive recommendations |
| **Memory Agent** | Episodic / semantic / procedural memory across missions |

Every step streams to the UI via **Server-Sent Events** — the user watches the agent reason, decide, and act in real time.

### Gemma Integration

- **Gemma 4 (`gemma-4-31b-it`)** is the decision-making engine — every reasoning step, tool choice, eligibility judgment, and document is produced by Gemma, served through **Google AI Studio** (free, no credit card) with OpenRouter as an optional fallback.
- **Native function calling** — the Google AI API `functionCall` / `functionResponse` protocol drives tool selection and execution (`lib/ai/gemma-provider.ts`).
- **JSON mode** (`response_mime_type: "application/json"`) guarantees parseable structured output for rankings, eligibility scores, and analyses.
- **Web search capability** — Gemma 4 performs live web searches for current opportunities (via OpenRouter's `web_search` plugin when configured; DuckDuckGo API as fallback).

### Opportunity Sourcing (3-Tier)

| Tier | Source | When |
|---|---|---|
| 1 | Gemma 4 web search / DuckDuckGo API | Always tried first (8s timeout) |
| 2 | PostgreSQL opportunity catalog | Fallback if web returns nothing |
| 3 | Curated fallback catalog | Last resort |

Every discovered opportunity receives **AI-generated advice** from Gemma 4 at runtime, including match score, success probability, competition level, and recommended action.

---

## Database Schema

PostgreSQL via Neon, managed with Drizzle ORM (`lib/db/schema.ts`):

| Table | Purpose |
|---|---|
| `opportunities` | Sourced opportunities (type, eligibility, deadline, location, skills) |
| `user_sessions` | Per-user session, profile, analysis results |
| `agent_missions` | Mission goal, status, preferences, metadata |
| `agent_iterations` | Every loop phase (reasoning, tool used, params, results) |
| `agent_memories` | Episodic / semantic / procedural memories with importance scores |
| `applications` | Application tracker (saved → drafting → submitted → interview → offer) |
| `reminders` | Deadline / follow-up / document reminders |
| `notification_log` | Email send history |

---

## Folder Structure

```
app/
  page.tsx                  # Landing (hero, features, example missions)
  mission/                  # Mission builder (goal + profile)
  agent/[sessionId]/        # Mission Control — live agent execution (SSE)
  dashboard/[sessionId]/    # Mission dashboard with charts
  workspace/[sessionId]/    # Opportunity grid
  opportunity/[sessionId]/[slug]/  # AI-scored opportunity detail
  applications/[sessionId]/ # Application Kanban tracker
  report/[sessionId]/       # Printable / PDF mission report
  memory/[sessionId]/       # Agent memory viewer
  settings/[sessionId]/     # System status + reminder preferences
  history/                  # All past missions
  api/
    agent/[sessionId]/stream/  # SSE endpoint (live agent loop)
    agent/[sessionId]/         # Mission CRUD
    chat/                      # AI assistant with web search
    missions/                  # Mission history API
    reminders/                 # Reminders + Resend email API

lib/
  agent/                   # Agent loop, personas, planner, reflection
    tools/                 # 9 Gemma-powered tools
  ai/                      # Gemma 4 provider + OpenRouter fallback
  db/                      # Drizzle schema + client
  actions/                 # Server actions (CRUD)
  hooks/                   # useSSE, useStreamingText
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_AI_API_KEY` | ✅ | Google AI Studio key — https://aistudio.google.com/apikey |
| `AI_PROVIDER` | ✅ | `gemma` (default) or `openrouter` |
| `AI_MODEL` | ✅ | `gemma-4-31b-it` |
| `DATABASE_URL` | ✅ | PostgreSQL connection string (Neon) |
| `OPENROUTER_API_KEY` | ⬜ | Fallback provider (optional) |
| `RESEND_API_KEY` | ⬜ | Email reminders (Resend) |
| `RESEND_FROM` | ⬜ | Email sender address |
| `CRON_SECRET` | ⬜ | Cron-protected jobs |

---

## API Architecture

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/agent/[sessionId]` | GET/POST | Mission state + launch |
| `/api/agent/[sessionId]/stream` | GET (SSE) | Live agent loop stream |
| `/api/chat` | POST | AI assistant (web search capable) |
| `/api/missions` | GET | Mission history |
| `/api/reminders` | GET/POST/DELETE | Reminders + Resend email |

All streaming uses **Server-Sent Events** with heartbeat keep-alive and graceful shutdown. Client state syncs via `useSSE` hook.

---

## Mission Lifecycle

```
User Mission ──► Mission Understanding ──► Reasoning ──► Planning
      ──► Tool Selection ──► Tool Calling ──► Observation
      ──► Reflection ──► Memory Update ──► Decision ──► (repeat)
      ──► Mission Complete ──► Dashboard ──► Workspace
      ──► Application Tracker ──► Mission Report (PDF)
```

Every phase is visible: the Mission Control screen streams reasoning text, tool calls (name, purpose, input, output, duration, status), and confidence scores in real time.

---

## Demo Guide (2 minutes)

1. **Landing** — click one of the example missions, e.g. *"Find AI internships in Europe for Summer 2027"* (auto-fills the mission builder).
2. **Mission Builder** — add your profile (skills, education, country), then **Launch Mission**.
3. **Mission Control** — watch Gemma 4 reason and act: *Mission Commander analyzing mission… Search Agent searching official portals… Evaluation Agent comparing eligibility…* — each tool call streams live with input, output, and duration.
4. **Dashboard** — mission stats, iteration chart, source distribution, top opportunities.
5. **Opportunity Detail** — AI match score with per-factor breakdown (education, country, experience, skills, funding), success probability, competition level, recommended action.
6. **Application Tracker** — drag applications across Draft → Preparing → Applied → Interview → Offer; set email reminders.
7. **Mission Report** — one-click printable / PDF report with summary, reasoning steps, tools invoked, skill gaps, and learning path.

### Screenshots for submission

Capture these screens on a live demo mission:

1. Landing page hero + example missions
2. Mission Control with live SSE agent timeline (tool calls visible)
3. Dashboard stats + charts
4. Opportunity detail with AI match score bars
5. Application Kanban tracker
6. Mission Report (print preview)
7. Settings page (system status + reminders)

---

## Quick Start

```bash
npm install
# 1. Copy .env.example → .env and fill GOOGLE_AI_API_KEY + DATABASE_URL
npm run seed     # optional: pre-populate opportunity catalog
npm run dev      # http://localhost:3000
```

## Deployment (Vercel)

```bash
npm i -g vercel
vercel
```

Set environment variables in the Vercel dashboard (Project → Settings → Environment Variables), then **Redeploy**. `vercel.json` is included with region and framework presets.

---

## Future Improvements

- [ ] CV builder with templates + versioning
- [ ] Skill-gap learning roadmap generation per opportunity
- [ ] Reminder delivery pipeline (cron + Resend) for deadline alerts
- [ ] Multi-language mission support (French, Portuguese, Swahili, Arabic)
- [ ] WhatsApp / Telegram notification channel
- [ ] Community opportunity sharing + verification badges

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing`)
3. Commit your changes (`git commit -m "Add amazing feature"`)
4. Push and open a Pull Request

Please ensure `npm run build` passes before submitting.

---

## License

MIT
