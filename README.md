# Opportunity AI

**Autonomous AI Career Intelligence Agent for Africa — powered by Gemma 4**
# 🚀 Opportunity AI

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Gemma](https://img.shields.io/badge/Gemma-4-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Tests](https://img.shields.io/badge/tests-12%20passing-success)

<p align="center">
  <img src="/public/image1.png" alt="Mission Control — Opportunity AI in action" width="880" />
</p>

<p align="center"><em>Mission Control — Opportunity AI autonomously reasons, plans, executes tools, and delivers complete opportunity workflows.</em></p>

Built for the **Build with Gemma: AI for Africa Minna Hackathon 2026** · Targets **Autonomous AI Agent**

> Give it a mission. Watch it work. Get a result.

## 🚀 Live Demo

🌐 https://opportunity-ai-snowy.vercel.app

📹 Demo Video

(Add your YouTube link)

📝 Kaggle Submission

[Opportunity AI — Autonomous Career Intelligence Agent](https://kaggle.com/competitions/build-with-gemma-ai-for-africa-hackathon-minna-2026/writeups/opportunity-ai-autonomous-career-intelligence-ag)

📂 Repository

https://github.com/somod-gif/Opportunity-AI

---

## What Is Opportunity AI?

Opportunity AI is an **autonomous AI career intelligence agent** purpose-built for African students and early-career professionals. It is not a chatbot, not a search engine, and not a template generator — it is a fully autonomous AI employee that takes a single mission and executes it end-to-end without human intervention.

### How It Works

You give it a mission in natural language — for example:

> *"Find AI/ML scholarships opening in the next 3 months that I qualify for as a Nigerian CS student, prepare my cover letters and CVs, and track all deadlines."*

Opportunity AI then:

1. **Decomposes** the mission into sub-tasks using Gemma 4's reasoning engine
2. **Searches** the web, databases, and curated catalogs across 4 sourcing tiers
3. **Evaluates** your eligibility against real opportunity criteria with evidence-based scoring
4. **Ranks** opportunities by match quality, deadline proximity, and fit score
5. **Generates** personalized application documents (cover letters, CVs, personal statements)
6. **Sets** deadline reminders with real email delivery via Resend
7. **Delivers** a complete mission report with all findings, documents, and next steps

Every step — from the agent's internal reasoning to tool calls, search results, and confidence scores — streams live to the screen over **Server-Sent Events (SSE)**. The agent's autonomy is not claimed; it is *watched* in real time.


<p align="center">
  <img src="/public/image2.png" alt="Mission Control — Opportunity AI in action" width="880" />
</p>
### Key Capabilities

| Capability | Description |
|-----------|-------------|
| **Autonomous execution** | 6-iteration agent loop, 3-minute mission cap, no human-in-the-loop |
| **Multi-source search** | Gemma 4 web search → DuckDuckGo API → PostgreSQL catalog → curated fallback |
| **Eligibility analysis** | AI-powered fit scoring grounded in real eligibility criteria |
| **Document generation** | Personalized cover letters, CVs, personal statements, and checklists |
| **Deadline tracking** | Email reminders via Resend, dispatched daily by GitHub Actions |
| **Persistent memory** | Episodic, semantic, and procedural memory recalled across sessions |
| **URL import** | Analyze any opportunity URL in one pass with full intelligence package |
| **Full transparency** | Live streaming of reasoning, tool calls, and confidence scores |

### Who It's For

- **African university students** applying for scholarships, internships, and fellowships
- **Early-career professionals** seeking grants, training programs, and career opportunities
- **Anyone** who loses opportunities to fragmented information, missed deadlines, and generic applications

Opportunity AI replaces the manual, error-prone workflow of opportunity hunting with an autonomous agent that does the discovery, analysis, preparation, and tracking **on your behalf**.

---

## Table of Contents

- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Why It's Autonomous](#why-its-autonomous)
  - [The Agent Loop](#the-agent-loop)
  - [The Toolset](#the-toolset)
  - [URL Import Agent](#url-import-agent)
- [Architecture](#architecture)
  - [Tech Stack](#tech-stack)
  - [Data Model](#data-model)
  - [Key Endpoints](#key-endpoints)
  - [Environment Variables](#environment-variables)
- [Gemma 4 Integration](#gemma-4-integration)
- [Reliability & Anti-Hallucination](#reliability--anti-hallucination)
- [Quick Start](#quick-start)
- [Deployment](#deployment)
  - [Vercel Deployment](#vercel-deployment)
  - [Background Scheduler (GitHub Actions)](#background-scheduler-github-actions)
  - [Setup Guide](#setup-guide)
- [Future Improvements](#future-improvements)

---

## The Problem

African students and early-career professionals lose real opportunities every cycle:

- **Fragmented sources** — scholarships, internships, fellowships, and grants are scattered across hundreds of portals, PDFs, and mailing lists.
- **Missed deadlines** — no centralized, deadline-aware tracking exists for most applicants.
- **Generic applications** — most candidates cannot afford personalized CVs, cover letters, and statements tuned to each opportunity.
- **No eligibility clarity** — students spend weeks applying to programs they do not qualify for, and never apply to ones they do.

---

## The Solution

Opportunity AI is **not a chatbot** and **not a search engine**. It is an autonomous AI employee: you hand it a single mission — *"Find AI scholarships I qualify for, prepare my documents, and track the deadlines"* — and Gemma 4 plans, reasons, searches the web, evaluates eligibility, ranks opportunities, writes application documents, sets reminders, and delivers a complete mission report. **No human intervention between input and output.** Every step streams live to the screen over SSE, so the agent's autonomy is not claimed — it is *watched*.

---

## Why It's Autonomous

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

### The Toolset

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

### URL Import Agent

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

### Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5.x (strict) |
| **UI** | React 19 + Tailwind CSS v4 + shadcn/ui |
| **AI Engine** | Gemma 4 (`gemma-4-31b-it`) via Google AI Studio |
| **Database** | PostgreSQL (Neon) + Drizzle ORM |
| **Streaming** | Server-Sent Events (SSE) |
| **Email** | Resend (reminder delivery) |
| **Scheduler** | GitHub Actions (daily reminder dispatch) |
| **Animations** | Framer Motion |
| **Icons** | lucide-react |

### Data Model

```
opportunities · user_sessions · agent_missions · agent_iterations
agent_memories (importance-ranked) · applications (Kanban)
reminders · import_analyses · notification_log
```

### Key Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/agent/[sessionId]/stream` | SSE — live agent execution stream |
| `GET /api/import/[sessionId]/stream` | SSE — import agent analysis stream |
| `GET /api/missions` | Mission history CRUD |
| `GET/POST/DELETE /api/reminders` | Reminder management |
| `GET /api/reminders/run` | Cron endpoint — process due reminders |
| `POST /api/chat` | AI assistant with web search |

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_AI_API_KEY` | Yes | Google AI Studio API key |
| `DATABASE_URL` | Yes | PostgreSQL connection string (Neon) |
| `AI_PROVIDER` | No | `gemma` (default) or `openrouter` |
| `AI_MODEL` | No | `gemma-4-31b-it` (default) |
| `RESEND_API_KEY` | No | Resend API key for email reminders |
| `CRON_SECRET` | No | Shared secret for cron endpoint auth |

---

## Gemma 4 Integration

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
| Reminders actually fire | Rows store the recipient email; a GitHub Actions workflow dispatches due reminders daily via Resend and marks them sent |
| Memory is actually recalled | `recallAcrossSessions()` pulls high-importance memories from the user's prior missions and injects them into the planner each iteration |
| Timeouts degrade gracefully | 3-min mission cap and 230s import cap finalize with partial results instead of hard failures; tool timeouts abort the underlying request |
| Proven by tests | **12 passing unit tests** (`npm test`) — deadline sanitization, URL validation, grounded scoring, type normalization, timeout/abort semantics |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Fill in: GOOGLE_AI_API_KEY, DATABASE_URL

# 3. (Optional) Seed opportunity catalog
npm run seed

# 4. Start development server
npm run dev       # → http://localhost:3000

# 5. Run tests
npm test          # 12 reliability tests

# 6. Build for production
npm run build
```

---

## Deployment

### Vercel Deployment

Deploy to Vercel with a single command:

```bash
npx vercel --prod
```

**Required environment variables** (set in Vercel dashboard → Project Settings → Environment Variables):

| Variable | Description |
|----------|-------------|
| `GOOGLE_AI_API_KEY` | Google AI Studio API key |
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `CRON_SECRET` | Random string for endpoint authentication |

### Background Scheduler (GitHub Actions)

Opportunity AI uses **GitHub Actions** instead of Vercel Cron for reminder dispatch. This section explains why and how to configure it.

#### Why GitHub Actions Instead of Vercel Cron?

| Factor | Vercel Cron | GitHub Actions |
|--------|-------------|----------------|
| **Plan required** | Vercel Pro ($20/mo) | Free (2,000+ min/month included) |
| **Retry logic** | None — single attempt, no backoff | Built-in retry with exponential backoff (up to 3 tries) |
| **Timeout** | 60s max (Hobby) / 300s (Pro) | 5-minute job timeout, 2-minute request timeout |
| **Logging** | Vercel Logs (limited retention) | Full GitHub Actions logs with step-by-step output |
| **Audit trail** | No native audit trail | Every run is recorded with status, timing, and output |
| **Manual trigger** | Not supported | `workflow_dispatch` — trigger from GitHub UI or API |
| **Notifications** | Requires third-party integration | Native Slack, email, and GitHub UI notifications |
| **Cost** | $20/mo for Pro plan | Free on all GitHub plans |

#### How Reminders Are Sent Automatically

```
Agent sets reminder → PostgreSQL (reminders table)
    → GitHub Actions (daily @ 8:00 AM WAT) → GET /api/reminders/run?secret=CRON_SECRET
    → processDueReminders() → Resend API → email delivered
    → reminder.sent = true → workflow logs success
```

1. **Agent sets a reminder** — during a mission, the agent stores a reminder row in PostgreSQL with the user's email, deadline, and message.
2. **GitHub Actions picks it up** — the `Reminder Scheduler` workflow runs daily at 8:00 AM WAT (7:00 AM UTC) via `schedule` event.
3. **API call** — the workflow sends a `GET` request to `https://<VERCEL_URL>/api/reminders/run` with the `CRON_SECRET` as both a Bearer token and query parameter.
4. **Endpoint processes due reminders** — the server finds all unsent reminders past their due date, sends branded Resend emails, and marks them as sent.
5. **Workflow logs the result** — the number of sent, failed, and skipped reminders is printed to the workflow log and summarized in the GitHub Actions run summary.

#### How to Configure GitHub Secrets

1. Go to your GitHub repository.
2. Navigate to **Settings → Secrets and Variables → Actions**.
3. Add the following repository secrets:

| Secret | Description | Example |
|--------|-------------|---------|
| `VERCEL_URL` | Your Vercel deployment domain (without `https://`) | `opportunity-ai-snowy.vercel.app` |
| `CRON_SECRET` | Must match the `CRON_SECRET` env var in your Vercel deployment | `your-secret-token` |

> ⚠️ **Never commit secrets to the repository.** The `.gitignore` file already excludes `.env*` files. Use GitHub Secrets for all sensitive values.

#### How to Manually Trigger the Scheduler

1. Go to your GitHub repository.
2. Navigate to **Actions → Reminder Scheduler**.
3. Click **Run workflow**.
4. (Optional) Set `dry_run` to `"true"` to log without sending emails.
5. Click **Run workflow**.

You can also trigger via the GitHub CLI:

```bash
gh workflow run reminders.yml --ref main
```

#### How to Monitor Workflow Logs

1. Go to your GitHub repository.
2. Navigate to **Actions → Reminder Scheduler**.
3. Click on any workflow run to see:
   - **Validate Secrets** — confirms `VERCEL_URL` and `CRON_SECRET` are set
   - **Dispatch Reminder Endpoint** — shows the HTTP request, response, and retry attempts
   - **Log Execution Summary** — a markdown summary table with sent/failed/skipped counts
   - **Workflow run summary** — a human-readable report appended to the run's summary page

Failed runs will:
- Automatically retry up to 3 times with exponential backoff (5s → 10s → 20s)
- Display the HTTP status code and error body for each attempt
- Fail the workflow with a clear error message if all retries are exhausted
- Show a red ❌ status in the Actions tab

### Setup Guide

1. **Deploy to Vercel** — ensure the `/api/reminders/run` endpoint is deployed and reachable.
2. **Set Vercel Environment Variables** — add `CRON_SECRET` (a random string) to your Vercel project.
3. **Set GitHub Secrets** — add `VERCEL_URL` and `CRON_SECRET` to your GitHub repository (see table above).
4. **Verify the workflow** — manually trigger the workflow from the Actions tab and check that it returns a 200 status.
5. **Monitor daily runs** — the workflow will automatically run every day at 8:00 AM WAT.

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