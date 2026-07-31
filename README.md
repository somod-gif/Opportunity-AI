# Opportunity AI

**Autonomous AI Career Intelligence Agent for Africa — powered by Gemma 4**

Built for the **Build with Gemma: AI for Africa Hackathon 2026** · Targets **Best Autonomous AI Agent**

> 🏆 Give it a mission. Watch it work. Get a result. **This is the Best Autonomous AI Agent — and it will win the hackathon.**

<p align="center">
  <img src="/image1.png" alt="Mission Control — Opportunity AI in action" width="880" />
</p>

<p align="center"><em>Mission Control — Opportunity AI autonomously reasons, plans, executes tools, and delivers complete opportunity workflows.</em></p>

Opportunity AI is **not a chatbot** and **not a search engine**. It is an autonomous AI employee: you hand it a single mission — *"Find AI scholarships I qualify for, prepare my documents, and track the deadlines"* — and Gemma 4 plans, reasons, searches the web, evaluates eligibility, ranks opportunities, writes application documents, sets reminders, and delivers a complete mission report. **No human intervention between input and output.** Every step streams live to the screen over SSE, so the agent's autonomy is not claimed — it is *watched*.

---

## The Problem

African students and early-career professionals lose real opportunities every cycle:

- **Fragmented sources** — scholarships, internships, fellowships, and grants are scattered across hundreds of portals, PDFs, and mailing lists.
- **Missed deadlines** — no centralized, deadline-aware tracking exists for most applicants.
- **Generic applications** — most candidates cannot afford personalized CVs, cover letters, and statements tuned to each opportunity.
- **No eligibility clarity** — students spend weeks applying to programs they do not qualify for, and never apply to ones they do.

Opportunity AI replaces this manual, error-prone workflow with an agent that does discovery, eligibility analysis, document generation, and deadline tracking **on the user's behalf**.

---

## Why It's Autonomous (the rubric story)

| Judge's question | What the system does |
|---|---|
| Who drives the loop? | **Gemma 4** drives every phase: mission decomposition, reasoning, tool selection, reflection, and memory updates. No scripted paths, no canned answers. |
| What can it actually do alone? | 9 tools, 4 sourcing tiers, 6 autonomous iterations, 3-minute mission cap, full mission report generated end-to-end. |
| What if tools fail? | Every tool has a fallback chain (Gemma web search → DuckDuckGo → database → curated catalog) and a timeout; the loop degrades gracefully instead of crashing. |
| How do we know it isn't faking? | Full transparency: reasoning, tool calls, inputs/outputs, and confidence stream live; search results carry `urlVerified` and `deadlineSource` markers; fit scores are grounded in evidence. |
| Does it learn across missions? | Yes — episodic/semantic/procedural memory persisted per user, and recalled at the start of every new mission. |

### The Agent Loop

```
User Mission ──► Perceive ──► Reason ──► Plan ──► Tool Select
     ──► Execute ──► Observe ──► Reflect ──► Memory Update ──► (repeat)
     ──► Mission Complete ──► Dashboard ──► Workspace ──► Tracker ──► Report (PDF)
```

Orchestrated by a **Mission Commander** with specialized sub-agents: Search, Eligibility Evaluation, Ranking, Documents, Reflection, and Memory. Every iteration is persisted to `agent_iterations` — the full audit trail is replayable.

### The Toolset (Gemma function calling)

| Tool | What it does |
|---|---|
| `search_opportunities` | 4-tier sourcing: Gemma 4 web search → DuckDuckGo API → PostgreSQL catalog → curated fallback |
| `web_search` | Live web search with AI-analyzed results |
| `analyze_eligibility` | Gemma 4 scores candidate fit against real eligibility criteria |
| `rank_opportunities` | Match scoring and sorting |
| `generate_document` | Cover letters, resumes, personal statements, checklists |
| `gap_analysis` | Skill gaps + learning roadmap |
| `email_reminder` / `set_reminder` | Deadline tracking with real email delivery |
| `memory_recall` / `memory_store` | Episodic, semantic, procedural memory |

### Analyze Any Opportunity (URL → full analysis in one pass)

Beyond search, the **Import Agent** consumes a single URL or pasted listing and autonomously produces a complete intelligence package:

```
URL ──► scrape ──► structured extraction ──► eligibility scoring (evidence-based)
    ──► skill-gap roadmap ──► week-by-week application strategy
    ──► similar opportunities research ──► persisted to workspace + tracker + memory
```

Each import is verified: the application URL is probed live, the deadline is validated (never fabricated), and the fit score is grounded in the eligibility checklist when one exists.

<p align="center">
  <img src="/image2.png" alt="Workspace, Dashboard and Opportunity Intelligence" width="880" />
</p>

<p align="center"><em>Workspace, Dashboard and Opportunity Intelligence.</em></p>

---

## Gemma 4 Integration (native, not bolted on)

- **`gemma-4-31b-it` is the entire decision-making engine** — reasoning, tool choices, eligibility judgments, documents, and advice are all generated by Gemma, served via **Google AI Studio** (free, no credit card) with OpenRouter as an optional fallback.
- **Native function calling** — the Google AI API `functionCall`/`functionResponse` protocol drives tool selection and execution (`lib/ai/gemma-provider.ts`).
- **JSON mode** (`response_mime_type: "application/json"`) guarantees parseable structured output for rankings, scores, and plans.
- **Web search capability** — Gemma's `web_search` plugin surfaces live, current opportunities; DuckDuckGo API is the resilience fallback.
- **Per-capability token budgets** — search, planning, and document generation each get tuned budgets (up to 8k for long-form docs), and all calls are **abortable** so the agent's 3-minute cap is never violated by a stalled model.
- **Runtime personalization** — every discovered opportunity receives Gemma-generated advice tuned to the user's profile, mission, and country.

---

## Reliability & Anti-Hallucination

The agent **never fabricates opportunity data** — anything it reports is either retrieved from a live source or explicitly marked as unverified. This is enforced in code and proven by tests.

| Guarantee | Implementation |
|---|---|
| No invented deadlines | `sanitizeDeadline()` rejects ambiguous/past/bare-year dates; results carry `deadline: null` + `deadlineSource: "stated" \| "unknown"` instead of fake dates |
| URLs are checked live | `verifyUrl()` HEAD/GET probe with timeout; results report `urlVerified` + HTTP status; UI shows "url verified / unverified" badges |
| Fit scores are evidence-based | `groundFitScore()` blends eligibility-checklist met-ratio + skill overlap into the AI score; with no evidence the score is **capped at 55/100** and flagged "limited evidence" |
| Reminders actually fire | Rows store the recipient email; a Vercel cron (`/api/reminders/run`, hourly, `CRON_SECRET`-protected) sends due reminders via Resend and marks them sent |
| Memory is actually recalled | `recallAcrossSessions()` pulls high-importance memories from the user's prior missions and injects them into the planner each iteration |
| Timeouts degrade gracefully | 3-min mission cap and 230s import cap finalize with partial results instead of hard failures; tool timeouts abort the underlying request |
| Proven by tests | **12 passing unit tests** (`npm test`) — deadline sanitization, URL validation, grounded scoring, type normalization, timeout/abort semantics |

```
Reminder pipeline:  Agent sets reminder (email stored on row)
   → Vercel Cron (hourly) → /api/reminders/run (CRON_SECRET)
   → due + unsent reminders → branded Resend email → marked sent (retried on failure)
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│ Next.js 16 App Router · TypeScript strict · Tailwind v4      │
│ app/agent/[sessionId]  ◄── SSE live stream ──  API route      │
└───────────────┬───────────────────────────────┬──────────────┘
        ┌───────▼────────┐              ┌────────▼─────────┐
        │  Gemma 4 Core  │              │  PostgreSQL      │
        │ function calls │              │ (Neon + Drizzle) │
        └───────┬────────┘              └────────▲─────────┘
    ┌───────────▼────────────────────────────────┘
    │ Multi-Agent Loop (≤6 iterations · 3-min cap)
    │ Perceive → Reason → Plan → Tool Select
    │ → Execute → Observe → Reflect → Memory
    └───────┬────────────────────────────────────
            │ Tools: search · web_search · eligibility
            │ · rank · document · gap · reminder · memory
```

**Stack:** Next.js 16 App Router · React 19 · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui · Drizzle ORM · PostgreSQL (Neon) · Server-Sent Events · Framer Motion · Resend.

**Data model** (Neon + Drizzle): `opportunities` · `user_sessions` · `agent_missions` · `agent_iterations` (full audit trail) · `agent_memories` (importance-ranked, embedded) · `applications` (Kanban) · `reminders` · `import_analyses` · `notification_log`.

**Key endpoints:** `/api/agent/[sessionId]/stream` (SSE) · `/api/import/[sessionId]/stream` (SSE import agent) · `/api/missions` · `/api/reminders` · `/api/reminders/run` (cron) · `/api/chat`.

**Env:** `GOOGLE_AI_API_KEY` · `AI_PROVIDER=gemma` · `AI_MODEL=gemma-4-31b-it` · `DATABASE_URL` · `RESEND_API_KEY` (optional) · `CRON_SECRET` (optional).

---

## Quick Start

```bash
npm install
# copy .env.example → .env; fill GOOGLE_AI_API_KEY + DATABASE_URL
npm run seed      # optional: pre-populate opportunity catalog
npm run dev       # http://localhost:3000
npm test          # 12 reliability tests
npm run build
```

Deploys to Vercel in one command (`vercel.json` ships with the cron schedule).

---

## Future Improvements

- [ ] CV builder with templates + versioning
- [ ] Multi-language missions (French, Portuguese, Swahili, Arabic)
- [ ] WhatsApp / Telegram notification channel
- [ ] Community opportunity sharing + verification badges

---

<p align="center">
  <strong>🏆 Best Autonomous AI Agent — Build with Gemma: AI for Africa Hackathon 2026.</strong>
  <br />
  <em>Give it a mission. Watch it work. Get a result.</em>
</p>
