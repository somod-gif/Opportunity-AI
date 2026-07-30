# Opportunity AI

**An Autonomous AI Career Agent for Africa, powered by Google Gemma 4.**

Built for **Build with Gemma: AI for Africa Hackathon 2026** — targeting **Best Autonomous AI Agent**.

---

## Overview

Opportunity AI is **NOT a chatbot**. It is **NOT a search engine**.

It is an **autonomous AI agent** that:
- Receives a **mission** (not a question)
- Automatically decomposes it into sub-tasks
- Assigns specialized **sub-agents** to each task
- Searches databases and the web for matching opportunities
- Evaluates eligibility and ranks matches using AI
- Generates professional application documents
- Stores everything in **persistent memory**
- Delivers a comprehensive **mission report**

The user feels like they hired an AI employee.

---

## Problem

African students and professionals face enormous friction finding and applying for global opportunities:
- **Fragmented information** — Scholarships, fellowships, grants, and internships are scattered across hundreds of websites
- **Manual effort** — Researching eligibility, preparing documents, tracking deadlines is time-consuming
- **Missed opportunities** — Many never find programs they qualify for
- **No personalized guidance** — Generic search engines don't understand individual profiles

---

## Solution

A **true autonomous AI agent** that:
1. **Understands** the user's education, skills, country, and career goals
2. **Searches** 8+ databases and web sources simultaneously
3. **Evaluates** eligibility using AI-powered analysis
4. **Ranks** opportunities by match score, deadline urgency, and competitiveness
5. **Generates** ATS-optimized resumes, cover letters, personal statements, and checklists
6. **Recommends** skills and courses to improve chances
7. **Remembers** everything across sessions
8. **Delivers** a complete mission report with actionable next steps

---

## Architecture

### Multi-Agent AI Team

```
Mission Commander
├── Scholarship Agent     → Searches DAAD, Mastercard, Commonwealth
├── Grant Agent           → Searches grant and fellowship programs
├── Internship Agent      → Finds internship opportunities
├── Research Agent        → Searches research programs
├── Competition Agent     → Finds competitions and hackathons
├── Web Intelligence      → Scrapes websites for additional data
├── Evaluation Agent      → Scores eligibility and ranks matches
├── Career Coach Agent    → Recommends skills and improvements
├── Document Agent        → Generates applications
├── Application Agent     → Prepares submissions and timelines
└── Verification Agent    → Validates source credibility
```

### Autonomous Loop

```
Perceive → Reason → Plan → Choose Tool → Execute → Observe → Reflect → Store Memory → Repeat
```

The agent loops autonomously up to 15-20 iterations, making independent decisions about which tools to call and what actions to take next.

### Tech Stack

| Category | Choice |
|----------|--------|
| Framework | Next.js 16.2.12 (App Router) |
| Language | TypeScript 5.x (strict mode) |
| UI | React 19.2.4 |
| Styling | Tailwind CSS v4 |
| Components | Radix / shadcn |
| Database | PostgreSQL (Neon Serverless) |
| ORM | Drizzle ORM 0.43.x |
| AI | Google Gemma 4 via OpenRouter |
| Animations | Framer Motion |
| Streaming | Server-Sent Events (SSE) |
| Icons | lucide-react |

---

## Gemma 4 Integration

Gemma 4 is the **brain** of the system. It handles:

- **Mission Planning** — Decomposes user goals into sub-tasks
- **Tool Selection** — Decides which tool to call and with what parameters
- **Reasoning** — Step-by-step thinking at each iteration
- **Opportunity Evaluation** — Analyzes eligibility and fit
- **Ranking** — Scores and ranks opportunities by multiple criteria
- **Gap Analysis** — Identifies missing skills and requirements
- **Document Generation** — Writes resumes, cover letters, statements
- **Career Coaching** — Recommends learning paths and improvements
- **Reflection** — Determines mission completeness
- **Memory Decisions** — Chooses what to store and forget

All AI calls go through **OpenRouter** for reliability, streaming support, and model flexibility.

---

## Project Structure

```
app/
├── page.tsx                    # Landing page (Mission Control)
├── layout.tsx                  # Root layout with providers
├── landing-client.tsx          # Interactive landing page
├── globals.css                 # Design system + color palette
├── mission/page.tsx            # Mission input form
├── agent/[sessionId]/
│   ├── page.tsx                # Agent execution (SSR)
│   └── client.tsx              # Streaming execution UI
├── dashboard/[sessionId]/
│   ├── page.tsx                # Mission dashboard
│   └── charts.tsx              # Dashboard visualizations
├── workspace/[sessionId]/
│   └── page.tsx                # Opportunity grid workspace
├── memory/[sessionId]/
│   └── page.tsx                # Agent memory viewer
└── api/
    ├── agent/[sessionId]/
    │   ├── route.ts            # Mission metadata REST API
    │   └── stream/route.ts     # SSE streaming endpoint
    └── auth/                   # Authentication API routes

lib/
├── ai/
│   ├── openrouter-provider.ts  # OpenRouter API integration
│   ├── gemma-provider.ts       # Direct Google AI API integration
│   ├── provider.ts             # AI provider interface
│   ├── registry.ts             # Provider registry
│   └── client.ts              # AI client wrapper
├── agent/
│   ├── multi-agent.ts          # Multi-Agent Coordinator
│   ├── engine.ts               # Single agent engine (legacy)
│   ├── emit.ts                 # SSE event emitter
│   ├── personas.ts             # Agent persona definitions
│   ├── planner.ts              # AI planning and reasoning
│   ├── reflection.ts           # Observation processing
│   ├── dispatcher.ts           # Tool execution dispatcher
│   ├── logger.ts               # Structured agent logging
│   ├── memory/AgentMemory.ts   # In-memory + DB memory store
│   ├── state/                  # State machine + context
│   ├── events/                 # Event bus
│   ├── prompts/                # AI prompt templates
│   └── tools/                  # Tool implementations
├── db/
│   ├── schema.ts               # 8 database tables
│   └── index.ts                # DB client (Neon + Drizzle)
└── types/
    ├── agent.ts                # Agent types (Mission, AgentState, etc.)
    └── opportunity.ts          # Opportunity types

components/
├── landing/                    # Landing page components
├── mission-control/            # Phase visualizer
├── results/                    # Opportunity cards, match scores
├── shared/                     # ErrorBoundary, LoadingSkeleton
├── ui/                         # shadcn components
└── providers/                  # React context providers
```

---

## Installation

```bash
# Clone the repository
git clone https://github.com/your-username/opportunity-ai.git
cd opportunity-ai

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database URL and OpenRouter API key

# Generate database schema
npm run db:generate
npm run db:push

# Seed database with opportunities
npm run seed

# Start development server
npm run dev
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Neon) |
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key for Gemma 4 |
| `OPENROUTER_BASE_URL` | No | Default: https://openrouter.ai/api/v1 |
| `OPENROUTER_MODEL` | No | Default: google/gemma-4-27b-it |
| `AI_PROVIDER` | No | Default: openrouter |
| `NEXT_PUBLIC_APP_URL` | No | Default: http://localhost:3000 |

---

## Database Schema

8 tables in PostgreSQL:

| Table | Purpose |
|-------|---------|
| `opportunities` | Scholarships, fellowships, grants, jobs, etc. |
| `user_sessions` | User profiles and sessions |
| `agent_missions` | Mission goals, status, metadata |
| `agent_iterations` | Each loop iteration with reasoning and tool results |
| `agent_memories` | Episodic, semantic, and procedural memories |
| `applications` | Application tracking and status |
| `reminders` | Deadline and follow-up reminders |
| `notification_log` | Email notification history |

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agent/[sessionId]/stream` | GET | SSE stream for agent execution |
| `/api/agent/[sessionId]` | GET | Mission metadata, iterations, memories |
| `/api/auth/session` | GET | Current auth session |
| `/api/auth/login` | POST | Login |
| `/api/auth/register` | POST | Register |

---

## Tools

The agent has 9 tools it can autonomously select and execute:

| Tool | Purpose |
|------|---------|
| `search_opportunities` | Search database by type, keywords, country |
| `web_search` | Search the web for opportunities not in DB |
| `deadline_extractor` | Extract and normalize deadlines |
| `eligibility_analyzer` | AI-powered eligibility scoring |
| `opportunity_ranking` | Rank by skills match, urgency, competitiveness |
| `gap_analysis` | Identify missing requirements |
| `generate_document` | Resume, cover letter, personal statement, checklist |
| `email_reminder` | Set deadline reminders |
| `pdf_generator` | Export documents as PDF |

---

## How to Demo

1. **Open the landing page** — Shows Mission Control with live agent team activity
2. **Type a mission** — e.g., "Find fully funded AI Master's scholarships in Europe for African students"
3. **Watch the agent work** — The execution screen shows:
   - 12 sub-agents being activated in sequence
   - Live streaming reasoning (typewriter effect)
   - Tool calls with real-time status
   - Memory updates as they happen
4. **View the dashboard** — After completion, see iterations, tools used, memories
5. **Check memory** — Full memory viewer with importance rankings
6. **Browse workspace** — Opportunities grid from search results

---

## Screenshots

[Screenshots placeholder — capture during demo]

---

## Future Improvements

- [ ] Email notifications for new opportunities matching user profile
- [ ] Multi-language support for French, Portuguese, Arabic
- [ ] Automated application submission via API
- [ ] LinkedIn integration for profile import
- [ ] Partner opportunity provider API integration
- [ ] Mobile app with push notifications
- [ ] Collaborative agent sessions (team missions)

---

## Team

Built for **Build with Gemma: AI for Africa Hackathon 2026 — Minna**.

---

## License

MIT
