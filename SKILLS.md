# Opportunity AI — Autonomous Agent Implementation Skill

This skill provides the complete implementation workflow for transforming the existing Opportunity AI batch pipeline into a true autonomous AI agent with visible reasoning, tool use, memory, and real-time streaming.

---

## When to Use This Skill

Load this skill when implementing any of the autonomous agent features:

| Scenario | Load This Skill |
|----------|-----------------|
| Building the agent loop engine | Yes |
| Creating tools (search, rank, etc.) | Yes |
| Setting up SSE streaming | Yes |
| Building the agent execution UI | Yes |
| Expanding the database schema | Yes |
| Creating multi-screen pages | Yes |
| Refactoring prompts for loop | Yes |
| Any work under `lib/agent/` | Yes |

---

## Implementation Checklist

### Prerequisites

```bash
npm install uuid framer-motion @tanstack/react-query
npm install -D @types/uuid
```

### Phase Order

Always implement in this order:

1. **Database Schema** — `lib/db/schema.ts` (new tables)
2. **Prompts** — `lib/agent/prompts/*.ts` (agent loop prompts)
3. **Tools** — `lib/agent/tools/*.ts` (tool implementations)
4. **Agent Types + Emitter** — `lib/agent/types.ts`, `lib/agent/emit.ts`
5. **Agent Loop Engine** — `lib/agent/engine.ts` (core)
6. **SSE Route** — `app/api/agent/[sessionId]/stream/route.ts`
7. **Agent Execution Screen** — `components/agent/execution-screen.tsx`
8. **Multi-Screen Pages** — `app/mission/`, `app/agent/`, `app/dashboard/`, etc.
9. **Landing Page Redesign** — `app/page.tsx`
10. **Seed Data** — `scripts/seed.ts`

---

## Implementation Guide for AI Agents

### Step 1: Read the Blueprint

Read `AGENTS.md` in full before touching any files. It contains the complete architecture, every file's exact code, and the strict implementation order.

### Step 2: Pick a Phase, Read the Relevant Section

Each phase in AGENTS.md has:
- The exact file paths to create/modify
- The complete code for each file
- Explanation of how it fits into the architecture

### Step 3: Verify After Each Phase

After completing a phase:
1. Run `npm run build` to check for TypeScript errors
2. Run `npm run db:generate` and `npm run db:push` if schema changed
3. Verify the development server starts: `npm run dev`

### Step 4: Follow Conventions

- No `any` types
- Server Components by default, `"use client"` only for interactivity
- Feature-based folders under `lib/` and `components/`
- Import order: React → Next → third-party → local (`@/`)
- Responsive design with Tailwind CSS v4
- Error boundaries on every page

---

## Architecture Quick Reference

```
lib/agent/
  types.ts       → AgentPhase, AgentState, SSEEvent, Mission, AgentResult
  engine.ts      → AutonomousAgent class (the loop)
  emit.ts        → SSEEmitter class (SSE events)
  mission.ts     → Mission parsing from user input

lib/agent/tools/
  base.ts        → AgentTool interface, ToolResult, ToolContext
  registry.ts    → ToolRegistry class
  search.ts      → searchOpportunitiesTool
  eligibility.ts → analyzeEligibilityTool
  rank.ts        → rankOpportunitiesTool
  document.ts    → generateDocumentTool
  memory.ts      → memoryRecallTool, memoryStoreTool
  web.ts         → webSearchTool
  notify.ts      → setReminderTool

lib/agent/prompts/
  system.ts      → buildSystemPrompt (master system prompt)
  reason.ts      → buildReasonPrompt
  tool-select.ts → buildToolSelectPrompt
  observe.ts     → buildObservePrompt
  memory-update.ts → buildMemoryUpdatePrompt

lib/db/schema.ts → +5 tables: agent_missions, agent_iterations, agent_memories, applications, reminders

app/
  page.tsx       → Updated landing
  mission/page.tsx → Mission input
  agent/[sessionId]/page.tsx → Agent execution
  dashboard/[sessionId]/page.tsx → Dashboard
  workspace/[sessionId]/page.tsx → Workspace
  memory/[sessionId]/page.tsx → Memory

app/api/agent/[sessionId]/stream/route.ts → SSE endpoint

components/
  agent/execution-screen.tsx → Main execution UI
  agent/iteration-view.tsx → Single iteration display
  agent/phase-indicator.tsx → Phase icons
  agent/thought-stream.tsx → Streaming text
  agent/tool-call-card.tsx → Tool display
  agent/tool-result-card.tsx → Result display
  agent/memory-toast.tsx → Memory notifications
```

## Agent Loop Flow

```
User provides mission
       ↓
SSE Route Handler creates AutonomousAgent
       ↓
Agent.initialize() → inserts agent_missions row
       ↓
Agent.run() → loop (max 15 iterations):
  iteration i:
    1. PERCEIVE  → emit "phase" event
    2. REASON    → emit "thought" event
    3. PLAN      → emit "phase" event
    4. TOOL CALL → emit "tool_call" event
    5. EXECUTE   → emit "tool_result" event
    6. OBSERVE   → emit "phase" event
    7. MEMORY    → emit "memory_update" event
    8. Store in agent_iterations table
       ↓
    Check missionComplete → if yes, break
       ↓
Agent.run() returns AgentResult
       ↓
Update agent_missions status to "complete" or "failed"
       ↓
Emit "complete" event
```
