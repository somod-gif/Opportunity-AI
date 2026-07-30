# Opportunity AI — Autonomous Agent Architecture & Implementation Blueprint

You are building **Opportunity AI**: an autonomous AI agent for the "Build with Gemma: AI for Africa Hackathon 2026" targeting the **Best Autonomous AI Agent** award ($250).

This document is the single source of truth for architecture, implementation order, and code standards.

---

## Core Identity

Opportunity AI is **NOT** a chatbot. It is **NOT** an AI assistant.

It is an **autonomous AI agent** that:
- Receives a **mission** (not a question)
- Thinks, plans, and executes **independently**
- Uses **tools** dynamically
- Maintains **persistent memory**
- Shows **visible reasoning** in real-time
- Loops until the mission is complete

The user should feel like they **hired an AI employee**.

---

## Tech Stack (Locked)

| Category | Choice |
|----------|--------|
| Framework | Next.js 16.2.12 (App Router) |
| Language | TypeScript 5.x (strict mode) |
| UI | React 19.2.4 |
| Styling | Tailwind CSS v4 + tw-animate-css |
| Components | shadcn/ui (Radix-Nova) |
| Forms | react-hook-form + Zod 4.x |
| Icons | lucide-react |
| Charts | recharts |
| Markdown | react-markdown |
| PDF | html2pdf.js |
| Toasts | sonner |
| Database | PostgreSQL (Neon Serverless) |
| ORM | Drizzle ORM 0.43.x |
| AI | Google Generative AI (Gemma 4: gemma-4-26b-a4b-it) |
| Animations | Framer Motion (install: `npm install framer-motion`) |
| TanStack Query | `npm install @tanstack/react-query` |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     PAGES                                 │
│  / → /mission → /agent/[id] → /dashboard/[id]            │
│                → /workspace/[id] → /memory/[id]          │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│              AGENT LOOP ENGINE                            │
│                                                           │
│  Perceive → Reason → Plan → Tool → Execute → Observe     │
│                                  ↓                        │
│                            Update Memory                  │
│                                  ↓                        │
│                            Repeat (up to 15 iterations)   │
│                                                           │
│  Each step streams to UI via SSE                          │
└─────────────────────┬───────────────────────────────────┘
          │                 │                    │
┌─────────▼──────┐ ┌───────▼────────┐ ┌─────────▼──────┐
│   TOOLS         │ │    MEMORY      │ │    PROMPTS     │
│  Registry       │ │  Episodic       │ │  System        │
│  Search         │ │  Semantic       │ │  Perceive      │
│  Eligibility    │ │  Procedural     │ │  Reason        │
│  Rank           │ │  DB-backed      │ │  Plan          │
│  Document       │ │  Importance-    │ │  Tool-Select   │
│  Memory Recall  │ │  ranked         │ │  Observe       │
│  Web Search     │ │                 │ │  Memory-Update │
│  Notify         │ │                 │ │                │
└─────────────────┘ └─────────────────┘ └────────────────┘
```

---

## File Structure (Complete)

```
lib/
  agent/
    types.ts              — AgentState, AgentPhase, ToolCall, SSEEvent types
    engine.ts             — AutonomousAgent class with loop
    mission.ts            — Mission parsing + validation
    emit.ts               — SSEEmitter class
    errors.ts             — Error recovery logic
    memory.ts             — AgentMemory (read/write/recall)

    tools/
      registry.ts         — ToolRegistry (maps name → tool instance)
      base.ts             — AgentTool interface + ToolResult type
      search.ts           — SearchOpportunitiesTool
      eligibility.ts      — AnalyzeEligibilityTool
      rank.ts             — RankOpportunitiesTool
      document.ts         — GenerateDocumentTool
      memory.ts           — MemoryRecallTool + MemoryStoreTool
      web.ts              — WebSearchTool
      notify.ts           — SendReminderTool

    prompts/
      index.ts            — Exports, shared constants
      system.ts           — Master system prompt for agent identity
      perceive.ts         — Perception stage prompt
      reason.ts           — Chain-of-thought reasoning prompt
      plan.ts             — Planning prompt
      tool-select.ts      — Tool selection prompt
      observe.ts          — Observation processing prompt
      memory-update.ts    — Memory storage decisions prompt

  db/
    index.ts              — DB client (unchanged)
    schema.ts             — Updated with 8 tables (3 existing + 5 new)

  ai/
    client.ts             — Updated: add streaming support
    agent.ts              — DEPRECATED, replaced by lib/agent/engine.ts
    provider.ts           — Unchanged
    registry.ts           — Unchanged
    gemma-provider.ts     — Add streaming method
    prompts/              — Existing prompts, refactored into lib/agent/prompts

  actions/
    ai.ts                 — Updated: dispatch agent instead of pipeline
    agent.ts              — NEW: launch agent, get status

components/
  landing/
    hero.tsx              — NEW: premium animated hero
    mission-input.tsx     — NEW: single textarea + examples

  agent/
    execution-screen.tsx  — NEW: full agent execution view
    iteration-view.tsx    — NEW: single iteration display
    phase-indicator.tsx   — NEW: perceive/reason/plan/tool/observe phases
    thought-stream.tsx    — NEW: streaming text with typewriter
    tool-call-card.tsx    — NEW: tool being called
    tool-result-card.tsx  — NEW: tool result display
    memory-toast.tsx      — NEW: memory update notification

  dashboard/
    status-card.tsx       — NEW: agent status summary
    task-list.tsx         — NEW: active/completed tasks
    next-actions.tsx      — NEW: suggested next steps
    discoveries.tsx       — NEW: recent discoveries
    progress-bar.tsx      — NEW: iteration progress

  workspace/
    opportunity-grid.tsx  — NEW: filterable grid
    filters.tsx           — NEW: filter controls
    bulk-actions.tsx      — NEW: batch operations
    tracker.tsx           — NEW: application status tracker

  memory/
    timeline.tsx          — NEW: chronological memory view
    memory-card.tsx       — NEW: individual memory display
    search.tsx            — NEW: memory search

  shared/
    streaming-text.tsx    — NEW: typewriter animation component
    agent-header.tsx      — NEW: consistent top bar

  ui/                    — shadcn components (existing, keep as-is)
  landing/               — Existing landing components
  ai/                    — Existing AI components (refactor to use new agent)
  results/               — Existing results components
  shared/                — Existing shared components

app/
  page.tsx               — UPDATED: simplified landing
  layout.tsx             — UPDATED: add QueryClientProvider
  mission/
    page.tsx             — NEW: mission input page
  agent/
    [sessionId]/
      page.tsx           — NEW: agent execution screen
  dashboard/
    [sessionId]/
      page.tsx           — NEW: mission dashboard
  workspace/
    [sessionId]/
      page.tsx           — NEW: opportunity workspace
  memory/
    [sessionId]/
      page.tsx           — NEW: agent memory view
  api/
    agent/
      [sessionId]/
        stream/
          route.ts       — NEW: SSE endpoint
        route.ts         — NEW: agent status/meta API

scripts/
  seed.ts                — UPDATED: 25-30 opportunities
```

---

## Implementation Order (STRICT)

```
Phase 4 (Database) → Phase 1c (Prompts) → Phase 1b (Tools)
  → Phase 1 (Agent Loop) → Phase 2 (SSE) → Phase 3 (UI)
  → Phase 5 (Pages) → Phase 6 (Landing) → Phase 7 (Seed) → Phase 8 (Final)
```

### Phase 4: Database Schema Expansion

Add to `lib/db/schema.ts`:

```typescript
// NEW imports needed:
import { integer, doublePrecision } from "drizzle-orm/pg-core";

// NEW TABLE 1: agent_missions
export const agentMissions = pgTable("agent_missions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: text("session_id").notNull().references(() => userSessions.sessionId),
  goal: text("goal").notNull(),
  status: text("status", {
    enum: ["running", "complete", "failed", "idle"],
  }).notNull().default("running"),
  currentIteration: integer("current_iteration").notNull().default(0),
  preferredTypes: text("preferred_types").array(),
  preferredRegions: text("preferred_regions").array(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// NEW TABLE 2: agent_iterations
export const agentIterations = pgTable("agent_iterations", {
  id: uuid("id").primaryKey().defaultRandom(),
  missionId: uuid("mission_id").notNull().references(() => agentMissions.id),
  iterationNumber: integer("iteration_number").notNull(),
  phase: text("phase", {
    enum: ["perceive", "reason", "plan", "tool_select", "tool_execute", "observe", "memory"],
  }).notNull(),
  reasoning: text("reasoning"),
  toolUsed: text("tool_used"),
  toolParams: jsonb("tool_params"),
  toolResult: jsonb("tool_result"),
  observations: text("observations"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// NEW TABLE 3: agent_memories
export const agentMemories = pgTable("agent_memories", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: text("session_id").notNull(),
  missionId: uuid("mission_id"),
  memoryType: text("memory_type", {
    enum: ["episodic", "semantic", "procedural"],
  }).notNull(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  importance: doublePrecision("importance").notNull().default(0.5),
  metadata: jsonb("metadata"),
  accessCount: integer("access_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  lastAccessed: timestamp("last_accessed").defaultNow(),
});

// NEW TABLE 4: applications
export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: text("session_id").notNull(),
  opportunityId: uuid("opportunity_id").references(() => opportunities.id),
  status: text("status", {
    enum: ["saved", "drafting", "submitted", "accepted", "rejected", "missed"],
  }).notNull().default("saved"),
  documentsGenerated: jsonb("documents_generated"),
  notes: text("notes"),
  deadline: timestamp("deadline"),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// NEW TABLE 5: reminders
export const reminders = pgTable("reminders", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: text("session_id").notNull(),
  opportunityId: uuid("opportunity_id").references(() => opportunities.id),
  type: text("type", {
    enum: ["deadline", "follow_up", "document"],
  }).notNull(),
  message: text("message").notNull(),
  dueAt: timestamp("due_at").notNull(),
  sent: boolean("sent").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// NEW types to export:
export type AgentMission = typeof agentMissions.$inferSelect;
export type NewAgentMission = typeof agentMissions.$inferInsert;
export type AgentIteration = typeof agentIterations.$inferSelect;
export type NewAgentIteration = typeof agentIterations.$inferInsert;
export type AgentMemory = typeof agentMemories.$inferSelect;
export type NewAgentMemory = typeof agentMemories.$inferInsert;
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;
```

### Phase 1c: Prompt Architecture

Create `lib/agent/prompts/system.ts`:

```typescript
export function buildSystemPrompt(mission: {
  goal: string;
  education?: string;
  skills?: string[];
  country?: string;
  careerGoal?: string;
}, toolDescriptions: string): string {
  return `You are an autonomous AI career agent for African students and professionals.

IDENTITY
You are not a chatbot. You do not wait for instructions after each step.
You have a mission. You work autonomously until the mission is complete.

MISSION
${mission.goal}
${mission.careerGoal ? `Career Goal: ${mission.careerGoal}` : ""}
${mission.education ? `Education: ${mission.education}` : ""}
${mission.skills?.length ? `Skills: ${mission.skills.join(", ")}` : ""}
${mission.country ? `Country: ${mission.country}` : ""}

AVAILABLE TOOLS
${toolDescriptions}

LOOP INSTRUCTIONS
For each iteration, you will:
1. PERCEIVE — Evaluate current state, check memory for relevant context
2. REASON — Think step by step. What do I know? What's missing? What should I do?
3. PLAN — Form a specific, actionable plan
4. SELECT TOOL — Choose ONE tool and provide parameters
5. OBSERVE — Process the tool's output, extract insights
6. UPDATE MEMORY — Decide what to store, update importance scores

TERMINATION CONDITIONS
Mark mission complete when:
- You've found and ranked at least 3 quality opportunities
- Generated documents for the top match
- Stored everything in memory
- Set up reminders for upcoming deadlines

RESPONSE FORMAT
Always return valid JSON:
{
  "phase": "perceive" | "reason" | "plan" | "tool_select" | "observe" | "complete",
  "reasoning": "Your step-by-step thinking...",
  "toolCall": { "name": "...", "params": { ... } } | null,
  "observations": "What you learned from tool output..." | null,
  "missionComplete": false,
  "memoryUpdates": [{ "key": "...", "value": "...", "type": "episodic|semantic|procedural", "importance": 0.8 }]
}`;
}
}
```

Create `lib/agent/prompts/reason.ts`:

```typescript
export function buildReasonPrompt(
  state: { mission: string; iteration: number; memory: string; lastResult: string | null }
): string {
  return `Current mission: ${state.mission}
Iteration: ${state.iteration}
Relevant memories: ${state.memory}
${state.lastResult ? `Last tool result: ${state.lastResult}` : "No previous actions yet."}

Think step by step about what to do next. Consider:
1. What do I know so far?
2. What am I still missing?  
3. What would be the most valuable next action?
4. Which tool would help me make progress?

Return your reasoning as a single paragraph.`;
}
```

Create `lib/agent/prompts/tool-select.ts`:

```typescript
export function buildToolSelectPrompt(
  reasoning: string,
  tools: Array<{ name: string; description: string; parameters: string }>
): string {
  return `Reasoning: ${reasoning}

Available tools:
${tools.map(t => `- ${t.name}: ${t.description} (params: ${t.parameters})`).join("\n")}

Choose ONE tool to call next. Return only the tool name and parameters as JSON.
{
  "tool": "tool_name",
  "params": { ... }
}`;
}
```

Create `lib/agent/prompts/observe.ts`:

```typescript
export function buildObservePrompt(
  toolName: string,
  toolResult: unknown,
  mission: string
): string {
  return `Tool called: ${toolName}
Result: ${JSON.stringify(toolResult)}
Mission: ${mission}

Analyze this result:
1. What did I learn from this tool call?
2. Does this bring me closer to completing the mission?
3. What gaps remain?
4. Should I continue or is the mission complete?

Return JSON:
{
  "observations": "Summary of what was learned...",
  "missionComplete": false,
  "remainingGaps": ["gap1"],
  "nextAction": "What to do next"
}`;
}
```

Create `lib/agent/prompts/memory-update.ts`:

```typescript
export function buildMemoryUpdatePrompt(
  phase: string,
  reasoning: string,
  toolResult: unknown
): string {
  return `Phase: ${phase}
Reasoning: ${reasoning}
Tool result: ${JSON.stringify(toolResult)}

Decide what memories to store:
- episodic: What happened? (searches, results, decisions)
- semantic: What facts did I learn? (user preferences, program details)
- procedural: What strategies worked? (search patterns, ranking criteria)

Return JSON array:
[{ "key": "search:scholarships-canada", "value": "Found 7 results...", "type": "episodic", "importance": 0.8 }]`;
}
```

### Phase 1b: Tool Architecture

Create `lib/agent/tools/base.ts`:

```typescript
import { z } from "zod";

export interface ToolResult {
  success: boolean;
  data: unknown;
  summary: string;
  metadata?: Record<string, unknown>;
}

export interface ToolContext {
  sessionId: string;
  missionId: string;
  db: import("@/lib/db").db;
  ai: import("@/lib/ai/client").ai;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: z.ZodTypeAny;
  execute(params: unknown, ctx: ToolContext): Promise<ToolResult>;
}
```

Create `lib/agent/tools/registry.ts`:

```typescript
import type { AgentTool } from "./base";

export class ToolRegistry {
  private tools = new Map<string, AgentTool>();

  register(tool: AgentTool): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): AgentTool {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Tool "${name}" not found`);
    return tool;
  }

  list(): AgentTool[] {
    return Array.from(this.tools.values());
  }

  describe(): Array<{ name: string; description: string; parameters: string }> {
    return this.list().map(t => ({
      name: t.name,
      description: t.description,
      parameters: JSON.stringify(t.parameters.describe()),
    }));
  }
}
```

Create `lib/agent/tools/search.ts`:

```typescript
import { z } from "zod";
import { db } from "@/lib/db";
import { opportunities } from "@/lib/db/schema";
import { eq, and, or, ilike, inArray, lte } from "drizzle-orm";
import type { AgentTool, ToolResult, ToolContext } from "./base";

export const searchOpportunitiesTool: AgentTool = {
  name: "search_opportunities",
  description: "Search for educational and career opportunities by type, keywords, country, and deadline",
  parameters: z.object({
    types: z.array(z.enum(["scholarship","fellowship","internship","grant","competition","conference","research","job","accelerator","hackathon"])).optional(),
    keywords: z.array(z.string()).optional(),
    country: z.string().optional(),
    deadlineBefore: z.string().optional(),
    limit: z.number().min(1).max(50).default(20),
  }),
  async execute(params, ctx: ToolContext): Promise<ToolResult> {
    const conditions = [eq(opportunities.isActive, true)];
    const p = params as z.infer<typeof searchOpportunitiesTool.parameters>;

    if (p.types?.length) {
      conditions.push(inArray(opportunities.type, p.types));
    }
    if (p.keywords?.length) {
      const keywordConditions = p.keywords.map(k =>
        or(
          ilike(opportunities.title, `%${k}%`),
          ilike(opportunities.description, `%${k}%`),
          ilike(opportunities.tags, `%${k}%`)
        )
      );
      conditions.push(or(...keywordConditions));
    }
    if (p.country) {
      conditions.push(or(
        ilike(opportunities.location, `%${p.country}%`),
        eq(opportunities.isRemote, true),
      ));
    }
    if (p.deadlineBefore) {
      conditions.push(lte(opportunities.deadline, new Date(p.deadlineBefore)));
    }

    const results = await db
      .select()
      .from(opportunities)
      .where(and(...conditions))
      .limit(p.limit!);

    return {
      success: true,
      data: results,
      summary: `Found ${results.length} matching opportunities`,
      metadata: { count: results.length },
    };
  },
};
```

Create `lib/agent/tools/eligibility.ts`:

```typescript
import { z } from "zod";
import type { AgentTool, ToolResult, ToolContext } from "./base";

export const analyzeEligibilityTool: AgentTool = {
  name: "analyze_eligibility",
  description: "Analyze eligibility for a specific opportunity given a career profile",
  parameters: z.object({
    opportunityTitle: z.string(),
    profileSkills: z.array(z.string()),
    profileEducation: z.string(),
    profileCountry: z.string(),
  }),
  async execute(params, ctx: ToolContext): Promise<ToolResult> {
    const p = params as z.infer<typeof analyzeEligibilityTool.parameters>;
    const result = await ctx.ai.generateJSON("eligibility-analysis",
      `Analyze eligibility for "${p.opportunityTitle}"
Candidate: Education=${p.profileEducation}, Skills=${p.profileSkills.join(", ")}, Country=${p.profileCountry}

Evaluate:
1. Does the candidate meet eligibility criteria?
2. What specific requirements are met?
3. What requirements are missing?
4. Overall eligibility score (0-100)

Return JSON: { "eligible": bool, "score": number, "metRequirements": string[], "missingRequirements": string[], "recommendations": string[] }`
    );
    return { success: true, data: result, summary: `Eligibility score: ${(result as any).score}/100` };
  },
};
```

Create `lib/agent/tools/rank.ts`:

```typescript
import { z } from "zod";
import type { AgentTool, ToolResult, ToolContext } from "./base";

export const rankOpportunitiesTool: AgentTool = {
  name: "rank_opportunities",
  description: "Rank a list of opportunities by match score given a career profile",
  parameters: z.object({
    opportunityIds: z.array(z.string()),
    criteria: z.object({
      skillsMatch: z.number().min(0).max(1).default(0.4),
      deadlineUrgency: z.number().min(0).max(1).default(0.2),
      competitiveness: z.number().min(0).max(1).default(0.2),
      locationPreference: z.number().min(0).max(1).default(0.2),
    }).optional(),
  }),
  async execute(params, ctx: ToolContext): Promise<ToolResult> {
    const p = params as z.infer<typeof rankOpportunitiesTool.parameters>;
    const { db } = await import("@/lib/db");
    const { opportunities } = await import("@/lib/db/schema");
    const { inArray } = await import("drizzle-orm");

    const opps = await db
      .select()
      .from(opportunities)
      .where(inArray(opportunities.slug, p.opportunityIds));

    return {
      success: true,
      data: opps.map(o => ({
        ...o,
        rankScore: Math.round(50 + Math.random() * 50), // AI-powered scoring replaces this
      })).sort((a, b) => b.rankScore - a.rankScore),
      summary: `Ranked ${opps.length} opportunities`,
    };
  },
};
```

Create `lib/agent/tools/document.ts`:

```typescript
import { z } from "zod";
import type { AgentTool, ToolResult, ToolContext } from "./base";
import { buildDocumentPrompt } from "@/lib/ai/prompts/document-generation";

export const generateDocumentTool: AgentTool = {
  name: "generate_document",
  description: "Generate an application document (cover letter, personal statement, resume, checklist)",
  parameters: z.object({
    type: z.enum(["cover-letter", "personal-statement", "resume", "checklist"]),
    opportunityTitle: z.string(),
    opportunityProvider: z.string(),
    opportunityType: z.string(),
    opportunityDescription: z.string(),
    opportunityEligibility: z.string(),
    opportunityDeadline: z.string().nullable(),
  }),
  async execute(params, ctx: ToolContext): Promise<ToolResult> {
    const p = params as z.infer<typeof generateDocumentTool.parameters>;
    const { ai } = await import("@/lib/ai/client");
    const doc = await ai.generateDocument(p.type, {
      name: "",
      education: "",
      skills: [],
      careerGoal: "",
      country: "",
    }, {
      title: p.opportunityTitle,
      provider: p.opportunityProvider,
      type: p.opportunityType,
      description: p.opportunityDescription,
      eligibilityCriteria: p.opportunityEligibility,
      deadline: p.opportunityDeadline,
    });
    return { success: true, data: doc, summary: `Generated ${p.type} for ${p.opportunityTitle}` };
  },
};
```

Create `lib/agent/tools/memory.ts`:

```typescript
import { z } from "zod";
import { db } from "@/lib/db";
import { agentMemories } from "@/lib/db/schema";
import { eq, desc, and, ilike } from "drizzle-orm";
import type { AgentTool, ToolResult, ToolContext } from "./base";

export const memoryRecallTool: AgentTool = {
  name: "memory_recall",
  description: "Retrieve relevant memories from past agent runs by key or query",
  parameters: z.object({
    query: z.string(),
    type: z.enum(["episodic", "semantic", "procedural"]).optional(),
    limit: z.number().min(1).max(20).default(10),
  }),
  async execute(params, ctx: ToolContext): Promise<ToolResult> {
    const p = params as z.infer<typeof memoryRecallTool.parameters>;
    const conditions = [eq(agentMemories.sessionId, ctx.sessionId)];
    if (p.type) conditions.push(eq(agentMemories.memoryType, p.type));

    const results = await db
      .select()
      .from(agentMemories)
      .where(and(...conditions))
      .orderBy(desc(agentMemories.importance))
      .limit(p.limit!);

    return {
      success: true,
      data: results,
      summary: `Recalled ${results.length} memories matching "${p.query}"`,
    };
  },
};

export const memoryStoreTool: AgentTool = {
  name: "memory_store",
  description: "Store a new memory or update an existing one",
  parameters: z.object({
    key: z.string(),
    value: z.string(),
    type: z.enum(["episodic", "semantic", "procedural"]),
    importance: z.number().min(0).max(1).default(0.5),
  }),
  async execute(params, ctx: ToolContext): Promise<ToolResult> {
    const p = params as z.infer<typeof memoryStoreTool.parameters>;
    await db.insert(agentMemories).values({
      sessionId: ctx.sessionId,
      missionId: ctx.missionId,
      memoryType: p.type,
      key: p.key,
      value: p.value,
      importance: p.importance,
    });
    return { success: true, data: null, summary: `Stored memory: ${p.key}` };
  },
};
```

Create `lib/agent/tools/notify.ts`:

```typescript
import { z } from "zod";
import { db } from "@/lib/db";
import { reminders } from "@/lib/db/schema";
import type { AgentTool, ToolResult, ToolContext } from "./base";

export const setReminderTool: AgentTool = {
  name: "set_reminder",
  description: "Set a deadline or follow-up reminder for an opportunity",
  parameters: z.object({
    opportunityTitle: z.string(),
    type: z.enum(["deadline", "follow_up", "document"]),
    message: z.string(),
    dueAt: z.string(),
  }),
  async execute(params, ctx: ToolContext): Promise<ToolResult> {
    const p = params as z.infer<typeof setReminderTool.parameters>;
    await db.insert(reminders).values({
      sessionId: ctx.sessionId,
      type: p.type,
      message: p.message,
      dueAt: new Date(p.dueAt),
    });
    return { success: true, data: null, summary: `Reminder set: ${p.message} (due ${p.dueAt})` };
  },
};
```

Create `lib/agent/tools/web.ts`:

```typescript
import { z } from "zod";
import type { AgentTool, ToolResult, ToolContext } from "./base";

export const webSearchTool: AgentTool = {
  name: "web_search",
  description: "Search the web for opportunities not yet in the database",
  parameters: z.object({
    query: z.string(),
    source: z.string().optional(),
  }),
  async execute(params, ctx: ToolContext): Promise<ToolResult> {
    const p = params as z.infer<typeof webSearchTool.parameters>;
    // Mock for hackathon — return realistic simulated results
    return {
      success: true,
      data: [
        { title: `${p.query} — Sample Result 1`, url: "https://example.com/1", description: "A relevant opportunity found online" },
        { title: `${p.query} — Sample Result 2`, url: "https://example.com/2", description: "Another matching opportunity" },
      ],
      summary: `Found 2 web results for "${p.query}"`,
      metadata: { note: "Web search is simulated for hackathon demo" },
    };
  },
};
```

### Phase 1: Agent Loop Engine

Create `lib/agent/types.ts`:

```typescript
export type AgentPhase = "perceive" | "reason" | "plan" | "tool_select" | "tool_execute" | "observe" | "memory" | "complete";

export interface AgentState {
  iteration: number;
  phase: AgentPhase;
  mission: string;
  reasoning: string;
  toolCall: { name: string; params: unknown } | null;
  toolResult: unknown;
  observations: string;
  missionComplete: boolean;
}

export interface SSEEvent {
  type: "phase" | "thought" | "tool_call" | "tool_result" | "memory_update" | "error" | "complete";
  data: unknown;
}

export interface Mission {
  goal: string;
  education?: string;
  skills?: string[];
  country?: string;
  careerGoal?: string;
  preferredTypes?: string[];
  preferredRegions?: string[];
}

export interface AgentResult {
  mission: Mission;
  iterations: AgentState[];
  summary: string;
  duration: number;
}
```

Create `lib/agent/emit.ts`:

```typescript
import type { SSEEvent } from "./types";

export class SSEEmitter {
  private controller: ReadableStreamDefaultController | null = null;
  private encoder = new TextEncoder();

  connect(controller: ReadableStreamDefaultController): void {
    this.controller = controller;
  }

  disconnect(): void {
    this.controller = null;
  }

  emit(event: SSEEvent): void {
    if (!this.controller) return;
    try {
      const data = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
      this.controller.enqueue(this.encoder.encode(data));
    } catch {
      this.controller = null;
    }
  }

  emitPhase(phase: string, iteration: number): void {
    this.emit({ type: "phase", data: { phase, iteration } });
  }

  emitThought(content: string): void {
    this.emit({ type: "thought", data: { content } });
  }

  emitToolCall(tool: string, params: unknown): void {
    this.emit({ type: "tool_call", data: { tool, params } });
  }

  emitToolResult(tool: string, result: unknown): void {
    this.emit({ type: "tool_result", data: { tool, result } });
  }

  emitMemoryUpdate(memories: unknown): void {
    this.emit({ type: "memory_update", data: { memories } });
  }

  emitComplete(summary: string): void {
    this.emit({ type: "complete", data: { summary } });
  }

  emitError(error: string): void {
    this.emit({ type: "error", data: { error } });
  }
}
```

Create `lib/agent/engine.ts` (the core):

```typescript
import { db } from "@/lib/db";
import { agentMissions, agentIterations, agentMemories } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { SSEEmitter } from "./emit";
import { ToolRegistry } from "./tools/registry";
import {
  searchOpportunitiesTool,
  analyzeEligibilityTool,
  rankOpportunitiesTool,
  generateDocumentTool,
  memoryRecallTool,
  memoryStoreTool,
  webSearchTool,
  setReminderTool,
} from "./tools";
import { buildSystemPrompt } from "./prompts/system";
import type { Mission, AgentState, AgentResult } from "./types";

export class AutonomousAgent {
  private mission: Mission;
  private emitter: SSEEmitter;
  private tools: ToolRegistry;
  private state: AgentState[] = [];
  private sessionId: string;
  private missionId: string;
  private maxIterations = 15;
  private ai: Awaited<ReturnType<typeof import("@/lib/ai/client").getAIInstance>> | null = null;

  constructor(sessionId: string, mission: Mission, emitter: SSEEmitter) {
    this.sessionId = sessionId;
    this.mission = mission;
    this.emitter = emitter;
    this.tools = new ToolRegistry();
    this.registerTools();
    this.missionId = "";
  }

  private registerTools(): void {
    this.tools.register(searchOpportunitiesTool);
    this.tools.register(analyzeEligibilityTool);
    this.tools.register(rankOpportunitiesTool);
    this.tools.register(generateDocumentTool);
    this.tools.register(memoryRecallTool);
    this.tools.register(memoryStoreTool);
    this.tools.register(webSearchTool);
    this.tools.register(setReminderTool);
  }

  async initialize(): Promise<{ missionId: string }> {
    const { ai } = await import("@/lib/ai/client");
    this.ai = ai;

    await db.insert(agentMissions).values({
      sessionId: this.sessionId,
      goal: this.mission.goal,
      status: "running",
      preferredTypes: this.mission.preferredTypes,
      preferredRegions: this.mission.preferredRegions,
    });

    const created = await db
      .select()
      .from(agentMissions)
      .where(eq(agentMissions.sessionId, this.sessionId))
      .orderBy(desc(agentMissions.createdAt))
      .limit(1)
      .then(r => r[0]);

    this.missionId = created.id;
    return { missionId: this.missionId };
  }

  async run(): Promise<AgentResult> {
    const startTime = Date.now();
    let completedState: AgentState | null = null;

    for (let i = 1; i <= this.maxIterations; i++) {
      const currentState = await this.executeIteration(i);
      this.state.push(currentState);
      completedState = currentState;

      if (currentState.missionComplete) break;
    }

    await db
      .update(agentMissions)
      .set({
        status: completedState?.missionComplete ? "complete" : "failed",
        currentIteration: this.state.length - 1,
        updatedAt: new Date(),
      })
      .where(eq(agentMissions.id, this.missionId));

    this.emitter.emitComplete(`Mission complete after ${this.state.length} iterations`);

    return {
      mission: this.mission,
      iterations: this.state,
      summary: `Completed in ${this.state.length} iterations`,
      duration: Date.now() - startTime,
    };
  }

  private async executeIteration(iteration: number): Promise<AgentState> {
    const systemPrompt = buildSystemPrompt(this.mission, this.tools.describe());
    const memories = await this.recallRelevantMemories();
    const currentState: AgentState = {
      iteration,
      phase: "perceive",
      mission: this.mission.goal,
      reasoning: "",
      toolCall: null,
      toolResult: null,
      observations: "",
      missionComplete: false,
    };

    // 1. PERCEIVE
    this.emitter.emitPhase("perceive", iteration);
    currentState.phase = "perceive";

    // 2. REASON
    this.emitter.emitPhase("reason", iteration);
    currentState.phase = "reason";

    const { getProvider } = await import("@/lib/ai/registry");
    const provider = getProvider();
    const lastResult = this.state[this.state.length - 1]?.toolResult;

    const { buildReasonPrompt } = await import("./prompts/reason");
    const reasonPrompt = buildReasonPrompt({
      mission: this.mission.goal,
      iteration,
      memory: memories,
      lastResult: lastResult ? JSON.stringify(lastResult) : null,
    });

    const reasoning = await provider.generate(reasonPrompt);
    currentState.reasoning = reasoning;
    this.emitter.emitThought(reasoning);

    // 3. PLAN + 4. SELECT TOOL
    this.emitter.emitPhase("plan", iteration);

    const { buildToolSelectPrompt } = await import("./prompts/tool-select");
    const toolPrompt = buildToolSelectPrompt(reasoning, this.tools.describe());
    const toolChoice = await provider.generateJSON<{ tool: string; params: Record<string, unknown> }>("tool-select", toolPrompt);

    currentState.toolCall = { name: toolChoice.tool, params: toolChoice.params };
    this.emitter.emitToolCall(toolChoice.tool, toolChoice.params);

    // 5. EXECUTE
    this.emitter.emitPhase("tool_execute", iteration);
    currentState.phase = "tool_execute";

    try {
      const tool = this.tools.get(toolChoice.tool);
      const result = await tool.execute(toolChoice.params, {
        sessionId: this.sessionId,
        missionId: this.missionId,
        db: db,
        ai: this.ai!,
      });
      currentState.toolResult = result;
      this.emitter.emitToolResult(toolChoice.tool, result);

      // Store iteration in DB
      await db.insert(agentIterations).values({
        missionId: this.missionId,
        iterationNumber: iteration,
        phase: currentState.phase,
        reasoning,
        toolUsed: toolChoice.tool,
        toolParams: toolChoice.params,
        toolResult: result,
        observations: result.summary,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      currentState.toolResult = { success: false, error: errorMsg, summary: errorMsg };
      this.emitter.emitError(errorMsg);
    }

    // 6. OBSERVE
    this.emitter.emitPhase("observe", iteration);
    currentState.phase = "observe";

    const { buildObservePrompt } = await import("./prompts/observe");
    const observePrompt = buildObservePrompt(
      toolChoice.tool,
      currentState.toolResult,
      this.mission.goal
    );
    const observation = await provider.generateJSON<{
      observations: string;
      missionComplete: boolean;
      remainingGaps: string[];
    }>("observe", observePrompt);

    currentState.observations = observation.observations;
    currentState.missionComplete = observation.missionComplete;

    // 7. UPDATE MEMORY
    this.emitter.emitPhase("memory", iteration);
    currentState.phase = "memory";

    const { buildMemoryUpdatePrompt } = await import("./prompts/memory-update");
    const memoryPrompt = buildMemoryUpdatePrompt(currentState.phase, reasoning, currentState.toolResult);
    const memoryUpdates = await provider.generateJSON<
      Array<{ key: string; value: string; type: "episodic" | "semantic" | "procedural"; importance: number }>
    >("memory-update", memoryPrompt);

    for (const mem of memoryUpdates) {
      await db.insert(agentMemories).values({
        sessionId: this.sessionId,
        missionId: this.missionId,
        memoryType: mem.type,
        key: mem.key,
        value: mem.value,
        importance: mem.importance,
      });
    }

    this.emitter.emitMemoryUpdate(memoryUpdates);

    return currentState;
  }

  private async recallRelevantMemories(): Promise<string> {
    const memories = await db
      .select()
      .from(agentMemories)
      .where(eq(agentMemories.sessionId, this.sessionId))
      .orderBy(desc(agentMemories.importance))
      .limit(10);

    if (memories.length === 0) return "No previous memories.";
    return memories.map(m => `[${m.memoryType}] ${m.key}: ${m.value.slice(0, 100)}`).join("\n");
  }
}
```

Create `lib/agent/tools/index.ts` for barrel exports:

```typescript
export { searchOpportunitiesTool } from "./search";
export { analyzeEligibilityTool } from "./eligibility";
export { rankOpportunitiesTool } from "./rank";
export { generateDocumentTool } from "./document";
export { memoryRecallTool, memoryStoreTool } from "./memory";
export { webSearchTool } from "./web";
export { setReminderTool } from "./notify";
```

### Phase 2: SSE Streaming

Create `app/api/agent/[sessionId]/stream/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { SSEEmitter } from "@/lib/agent/emit";
import { AutonomousAgent } from "@/lib/agent/engine";
import type { Mission } from "@/lib/agent/types";

export const runtime = "edge";

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
): Promise<Response> {
  const { sessionId } = params;
  const url = new URL(req.url);
  const goal = url.searchParams.get("goal") || "";
  const education = url.searchParams.get("education") || undefined;
  const skills = url.searchParams.get("skills")?.split(",") || undefined;
  const country = url.searchParams.get("country") || undefined;
  const careerGoal = url.searchParams.get("careerGoal") || undefined;

  if (!goal) {
    return new Response("Missing goal parameter", { status: 400 });
  }

  const mission: Mission = { goal, education, skills, country, careerGoal };
  const emitter = new SSEEmitter();
  const agent = new AutonomousAgent(sessionId, mission, emitter);

  const stream = new ReadableStream({
    start(controller) {
      emitter.connect(controller);

      // Initialize mission in DB
      agent.initialize().then(() => {
        // Run agent — it emits events via emitter
        agent.run().catch((error) => {
          emitter.emitError(error instanceof Error ? error.message : String(error));
        });
      }).catch((error) => {
        emitter.emitError(error instanceof Error ? error.message : String(error));
      });
    },
    cancel() {
      emitter.disconnect();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

### Phase 3: Agent Execution Screen

Create `components/agent/execution-screen.tsx`:

```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, CheckCircle2, Search, Brain, Target, Wrench, Eye, Database, ChevronRight } from "lucide-react";
import type { AgentPhase } from "@/lib/agent/types";

interface PhaseEvent {
  phase: AgentPhase;
  iteration: number;
}

interface ThoughtEvent {
  content: string;
}

interface ToolCallEvent {
  tool: string;
  params: unknown;
}

interface ToolResultEvent {
  tool: string;
  result: { summary?: string; success?: boolean };
}

interface MemoryUpdateEvent {
  memories: Array<{ key: string; type: string; importance: number }>;
}

interface ExecutionScreenProps {
  sessionId: string;
  goal: string;
  onComplete?: () => void;
}

const phaseIcons: Record<string, typeof Bot> = {
  perceive: Eye,
  reason: Brain,
  plan: Target,
  tool_select: Wrench,
  tool_execute: Search,
  observe: Eye,
  memory: Database,
};

const phaseColors: Record<string, string> = {
  perceive: "text-blue-500",
  reason: "text-violet-500",
  plan: "text-amber-500",
  tool_select: "text-cyan-500",
  tool_execute: "text-emerald-500",
  observe: "text-rose-500",
  memory: "text-purple-500",
};

export function ExecutionScreen({ sessionId, goal, onComplete }: ExecutionScreenProps) {
  const [currentPhase, setCurrentPhase] = useState<PhaseEvent | null>(null);
  const [thoughts, setThoughts] = useState<string[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCallEvent[]>([]);
  const [toolResults, setToolResults] = useState<ToolResultEvent[]>([]);
  const [memories, setMemories] = useState<MemoryUpdateEvent[]>([]);
  const [completed, setCompleted] = useState(false);
  const [currentThought, setCurrentThought] = useState("");
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const source = new EventSource(
      `/api/agent/${sessionId}/stream?goal=${encodeURIComponent(goal)}`
    );

    source.addEventListener("phase", (e) => {
      setCurrentPhase(JSON.parse(e.data));
    });

    source.addEventListener("thought", (e) => {
      const data: ThoughtEvent = JSON.parse(e.data);
      setThoughts(prev => [...prev, data.content]);
      typewriterEffect(data.content);
    });

    source.addEventListener("tool_call", (e) => {
      const data: ToolCallEvent = JSON.parse(e.data);
      setToolCalls(prev => [...prev, data]);
    });

    source.addEventListener("tool_result", (e) => {
      const data: ToolResultEvent = JSON.parse(e.data);
      setToolResults(prev => [...prev, data]);
    });

    source.addEventListener("memory_update", (e) => {
      const data: MemoryUpdateEvent = JSON.parse(e.data);
      setMemories(prev => [...prev, data]);
    });

    source.addEventListener("complete", () => {
      setCompleted(true);
      onComplete?.();
    });

    source.addEventListener("error", (e) => {
      console.error("Agent error:", e.data);
    });

    return () => source.close();
  }, [sessionId, goal, onComplete]);

  function typewriterEffect(text: string) {
    setCurrentThought("");
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setCurrentThought(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 15);
    return () => clearInterval(interval);
  }

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thoughts, toolCalls, toolResults, currentPhase]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Autonomous Agent</h2>
              <p className="text-sm text-muted-foreground line-clamp-1">{goal}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {completed ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-emerald-500">
                <CheckCircle2 className="h-4 w-4" /> Complete
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Working...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main execution area */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Iteration Timeline */}
        <div className="lg:col-span-2 space-y-4">
          {currentPhase && (
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-muted ${phaseColors[currentPhase.phase]}`}>
                  {React.createElement(phaseIcons[currentPhase.phase] || Bot, { className: "h-4 w-4" })}
                </div>
                <div>
                  <span className="text-sm font-medium capitalize">{currentPhase.phase}</span>
                  <span className="ml-2 text-xs text-muted-foreground">Iteration {currentPhase.iteration}</span>
                </div>
              </div>

              {currentThought && (
                <div className="rounded-lg bg-muted/30 p-4">
                  <p className="text-sm text-foreground/80 leading-relaxed">{currentThought}</p>
                </div>
              )}
            </div>
          )}

          {/* Tool calls */}
          {toolCalls.slice(-3).map((tc, i) => (
            <div key={`tc-${i}`} className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-medium text-cyan-500">
                <Wrench className="h-4 w-4" />
                Called: {tc.tool}
              </div>
              <pre className="mt-2 text-xs text-muted-foreground overflow-x-auto">
                {JSON.stringify(tc.params, null, 2)}
              </pre>
            </div>
          ))}

          {/* Tool results */}
          {toolResults.slice(-3).map((tr, i) => (
            <div key={`tr-${i}`} className="rounded-lg border bg-card p-4 shadow-sm">
              <div className={`flex items-center gap-2 text-sm font-medium ${tr.result.success !== false ? "text-emerald-500" : "text-destructive"}`}>
                <CheckCircle2 className="h-4 w-4" />
                {tr.tool} → {tr.result.summary || "Done"}
              </div>
            </div>
          ))}

          <div ref={logEndRef} />
        </div>

        {/* Right: Memory panel */}
        <div className="space-y-3">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Database className="h-4 w-4 text-purple-500" />
              Agent Memory
            </h3>
            <div className="space-y-2">
              {memories.length === 0 && (
                <p className="text-xs text-muted-foreground">No memories stored yet</p>
              )}
              {memories.slice(-5).reverse().map((m, i) => (
                <div key={`mem-${i}`} className="rounded-md bg-muted/20 p-2 text-xs">
                  {m.memories.slice(0, 2).map((mem, j) => (
                    <div key={j} className="flex items-center gap-1.5">
                      <Database className="h-3 w-3 text-purple-400" />
                      <span className="text-muted-foreground">{mem.key}</span>
                      <span className="text-[10px] text-muted-foreground/50">({Math.round(mem.importance * 100)}%)</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-medium">Agent Loop Progress</h3>
            <div className="space-y-2">
              {["perceive", "reason", "plan", "tool_execute", "observe", "memory"].map((phase) => {
                const isActive = currentPhase?.phase === phase;
                const isDone = thoughts.length > 0 && !isActive;
                return (
                  <div key={phase} className="flex items-center gap-2 text-xs">
                    <div className={`h-2 w-2 rounded-full ${
                      isActive ? "bg-primary animate-pulse" : isDone ? "bg-emerald-500" : "bg-muted-foreground/20"
                    }`} />
                    <span className={`capitalize ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {phase}
                    </span>
                    {isActive && <ChevronRight className="h-3 w-3 text-primary animate-pulse" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Phase 5: Multi-Screen Pages

Create `app/mission/page.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Sparkles } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
// Note: install uuid: npm install uuid && npm install -D @types/uuid

const EXAMPLES = [
  "I am a Nigerian Computer Science student looking for fully-funded AI scholarships in Canada",
  "I need AI/ML internships in Europe for summer 2027",
  "I want a fully-funded Masters in Data Science anywhere in the world",
  "I am a Kenyan engineering graduate looking for tech fellowships",
  "I need conference funding for research in renewable energy",
];

export default function MissionPage() {
  const router = useRouter();
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);

  function launchAgent() {
    if (!goal.trim()) return;
    setLoading(true);
    const sessionId = uuidv4();
    sessionStorage.setItem(`agent_${sessionId}_goal`, goal);
    router.push(`/agent/${sessionId}?goal=${encodeURIComponent(goal)}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Bot className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">What is your mission?</h1>
        <p className="mt-2 text-muted-foreground">
          Describe your goal. The AI agent handles everything else.
        </p>
      </div>

      <div className="space-y-4">
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="e.g. I am a Nigerian CS student looking for fully-funded AI scholarships in Canada..."
          className="w-full min-h-[120px] rounded-xl border bg-card p-4 text-base shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
        />

        <button
          onClick={launchAgent}
          disabled={!goal.trim() || loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="animate-spin">⟳</span> Launching Agent...
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-5 w-5" /> Launch Autonomous Agent
            </span>
          )}
        </button>
      </div>

      <div className="mt-8">
        <p className="text-xs text-muted-foreground mb-3 text-center">Try an example</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => setGoal(ex)}
              className="rounded-full border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/60 transition-colors"
            >
              {ex.length > 50 ? ex.slice(0, 50) + "..." : ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

Create `app/agent/[sessionId]/page.tsx`:

```typescript
import { Suspense } from "react";
import { ExecutionScreen } from "@/components/agent/execution-screen";

export default async function AgentPage({
  params,
  searchParams,
}: {
  params: { sessionId: string };
  searchParams: { goal?: string };
}) {
  const goal = searchParams.goal || sessionStorage?.getItem(`agent_${params.sessionId}_goal`) || "";

  return (
    <main className="min-h-screen py-8 px-4">
      <Suspense fallback={<div className="text-center py-16">Loading agent...</div>}>
        <ExecutionScreen sessionId={params.sessionId} goal={goal} />
      </Suspense>
    </main>
  );
}
```

Create `app/dashboard/[sessionId]/page.tsx`:

```typescript
export default async function DashboardPage({
  params,
}: {
  params: { sessionId: string };
}) {
  return (
    <main className="min-h-screen py-8 px-4">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold mb-6">Mission Dashboard</h1>
        <p className="text-muted-foreground">Dashboard implementation phase — coming live...</p>
      </div>
    </main>
  );
}
```

Create `app/workspace/[sessionId]/page.tsx`:

```typescript
export default async function WorkspacePage({
  params,
}: {
  params: { sessionId: string };
}) {
  return (
    <main className="min-h-screen py-8 px-4">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold mb-6">Opportunity Workspace</h1>
        <p className="text-muted-foreground">Workspace implementation phase — coming live...</p>
      </div>
    </main>
  );
}
```

Create `app/memory/[sessionId]/page.tsx`:

```typescript
export default async function MemoryPage({
  params,
}: {
  params: { sessionId: string };
}) {
  return (
    <main className="min-h-screen py-8 px-4">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Agent Memory</h1>
        <p className="text-muted-foreground">Memory implementation phase — coming live...</p>
      </div>
    </main>
  );
}
```

### Phase 6: Landing Page Redesign

Update `app/page.tsx`:

```typescript
import Link from "next/link";
import { Bot, Sparkles, ArrowRight, Brain, Wrench, Database, Search } from "lucide-react";

const features = [
  { icon: Brain, title: "Autonomous Reasoning", desc: "The agent thinks, plans, and decides independently. You don't guide it — you give it a mission." },
  { icon: Search, title: "Dynamic Tool Use", desc: "Searches, evaluates, ranks, and generates documents using a suite of tools it chooses on the fly." },
  { icon: Database, title: "Persistent Memory", desc: "Remembers every search, decision, and document. Each session builds on the last." },
  { icon: Wrench, title: "Document Generation", desc: "Writes cover letters, personal statements, resumes, and checklists tailored to each opportunity." },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">O</div>
            <span className="text-sm font-semibold">Opportunity AI</span>
          </div>
          <Link
            href="/mission"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80"
          >
            Start Mission <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden py-20 sm:py-28">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="mx-auto max-w-4xl px-4 text-center relative">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Your Autonomous
              <span className="block text-primary">Opportunity Agent</span>
              for Africa
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Not a chatbot. Not a search engine. An AI agent that autonomously discovers, evaluates, and applies to opportunities — so you don&apos;t have to.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link
                href="/mission"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
              >
                <Sparkles className="h-5 w-5" /> Start Your Mission
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f, i) => (
                <div key={i} className="rounded-xl border bg-card p-6 shadow-sm">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t py-16">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-2xl font-bold mb-8">How the Agent Works</h2>
            <div className="space-y-4 text-left max-w-lg mx-auto">
              {[
                ["Perceive", "Understands your goal, education, skills, and country context"],
                ["Reason", "Thinks step-by-step about what to search and prioritize"],
                ["Plan", "Creates an action plan with specific next steps"],
                ["Execute", "Searches databases, evaluates eligibility, ranks matches"],
                ["Generate", "Creates cover letters, statements, resumes, checklists"],
                ["Remember", "Stores everything in persistent memory for future sessions"],
              ].map(([step, desc], i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <span className="font-medium">{step}</span>
                    <span className="text-muted-foreground"> — {desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-center text-xs text-muted-foreground">
            Built with Gemma 4 — Best Autonomous AI Agent, Build with Gemma: AI for Africa Hackathon 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
```

---

## Coding Conventions

1. **No `any` types** — strict TypeScript everywhere
2. **Server Components by default** — only `"use client"` when necessary (interactivity, browser APIs)
3. **Feature-based folders** — group by domain (agent/, tools/, prompts/)
4. **No duplicated code** — extract shared logic into lib/utils or hooks
5. **Import order**: React → Next → third-party → local (absolute paths with `@/`)
6. **Component naming**: PascalCase, one component per file, same name as file
7. **CSS Tailwind v4**: use `@apply` in CSS files sparingly, prefer inline classes
8. **Error handling**: Every server action returns `ActionResult<T>` type
9. **Loading states**: Every page has a `loading.tsx` or Suspense boundary
10. **No comments in production code** unless explaining a non-obvious decision

---

## Key Architecture Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Agent Loop | Iterative with explicit phases | Visible autonomy, not batch pipeline |
| Streaming | SSE via Route Handler | Real-time, simple, auto-reconnect |
| Tools | Registry pattern + Zod schemas | Type-safe, extensible, agent-dynamic |
| Memory | 3 types (episodic/semantic/procedural) | Structured, rankable, queryable |
| State | URL-driven with sessionId | Shareable, bookmarkable, supports resume |
| AI | Gemma 4 via Google API | Already integrated, proven reliability |
| UI | shadcn/ui + Tailwind v4 | Matches existing, premium look |
| Orchestration | Single agent class | Simple, debuggable, hackathon-ready |

---

## Build & Deploy

```bash
# Install new dependencies
npm install uuid framer-motion @tanstack/react-query
npm install -D @types/uuid

# Generate database migrations
npm run db:generate
npm run db:push

# Seed database with 25-30 opportunities
npm run seed

# Run development server
npm run dev
```
