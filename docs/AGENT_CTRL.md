# AGENT_CTRL — Agent Control & Architecture

## Automonous Loop

```
Mission Input
  │
  ├─► Agent.perceive()    — Parse mission, extract entities
  ├─► Agent.reason()      — Gemini 4 analyzes context, plans next step
  ├─► Agent.selectTool()  — Chooses tool based on reasoning
  ├─► Agent.execute()     — Runs tool with timeout (30s hard cap)
  ├─► Agent.observe()     — Process tool output, extract insights
  ├─► Agent.reflect()     — Check if mission is complete
  ├─► Agent.storeMemory() — Save key findings to DB
  │
  └── Loop up to 6 iterations, 3 min total timeout
```

## Tool Registry (`lib/agent/tools/`)

| Tool | File | Purpose |
|------|------|---------|
| `search_opportunities` | `search-all.ts` | 4-tier search: Gemma 4 web → DuckDuckGo → DB → Curated fallback |
| `web_search` | `web.ts` | DuckDuckGo API + keyword-matched curated results |
| `analyze_eligibility` | `eligibility.ts` | Gemma 4 evaluates candidate fit |
| `generate_document` | `document.ts` | Resume, cover letter, personal statement via Gemma 4 |
| `rank_opportunities` | `rank.ts` | Score and sort by match quality |
| `memory_recall` | `memory.ts` | Retrieve from episodic/semantic/procedural memory |
| `memory_store` | `memory.ts` | Store to DB-backed memory |
| `set_reminder` | `notify.ts` | Deadline tracking |

## 4-Tier Search Flow (`search-all.ts`)

```
search_opportunities(query)
  │
  ├─ Tier 1: Gemma 4 + OpenRouter web_search plugin  (45s timeout)
  │   └─ Uses plugins: [{ id: "web_search" }] in API request
  │
  ├─ Tier 2: DuckDuckGo Instant Answer API            (8s timeout)
  │   └─ Fallback if Gemma fails (rate limit / error)
  │
  ├─ Tier 3: PostgreSQL Database (Drizzle ORM)
  │   └─ Used if both web sources return no results
  │
  └─ Tier 4: Curated keyword-matched opportunities
      └── Always returns something useful
```

## AI Integration (`lib/ai/`)

| Provider | File | Model |
|----------|------|-------|
| OpenRouter (primary) | `openrouter-provider.ts` | `google/gemma-4-26b-a4b-it:free` |
| Google AI (fallback) | `gemma-provider.ts` | `gemma-4-26b-a4b-it` |

### OpenRouter Web Search

When capability is `"search"`, the provider injects `plugins: [{ id: "web_search" }]` into the API request. OpenRouter automatically:
1. Searches the web
2. Injects live results into Gemma 4's context
3. Gemma returns structured JSON with opportunities

### Rate Limits

| Limit | Value |
|-------|-------|
| Free model requests/day | 50 (or 1000 with 10 credits) |
| Request timeout (search) | 45s with 2 retries |
| Request timeout (normal) | 30s with 2 retries |
| Streaming timeout | 60s |

## Agent Configuration (`lib/agent/engine.ts`)

| Parameter | Value |
|-----------|-------|
| maxIterations | 6 |
| maxDuration | 180000ms (3 min) |
| toolTimeout | 30000ms (30s) |

## Memory Types (`lib/agent/memory.ts`)

| Type | Purpose |
|------|---------|
| Episodic | Event logs: what happened during execution |
| Semantic | Knowledge: opportunities found, scores, criteria |
| Procedural | Skills: how to use tools, patterns |

## SSE Events (`lib/agent/emit.ts`)

| Event | Payload |
|-------|---------|
| `phase` | `{ phase: AgentPhase, iteration: number }` |
| `reasoning` | `{ text: string }` |
| `tool_start` | `{ tool: string, params: object }` |
| `tool_result` | `{ tool: string, result: ToolResult }` |
| `tool_error` | `{ tool: string, error: string }` |
| `memory` | `{ text: string }` |
| `complete` | `{ ...missionReport }` |
| `error` | `{ error: string }` |
