---
name: opportunity-ai
description: Build the autonomous AI agent loop, tools, memory, SSE streaming, and multi-screen UI for Opportunity AI
version: 1.0.0
---

# Opportunity AI — Autonomous Agent Build Skill

## Description

This skill provides the workflow, conventions, and implementation steps for building the Opportunity AI autonomous agent system. It transforms the existing batch-pipeline CareerAgent into a true agent-loop architecture with visible reasoning, dynamic tool use, structured memory, and real-time SSE streaming.

Use this skill whenever you are implementing or modifying:
- `lib/agent/*` — the agent loop engine
- `lib/agent/tools/*` — tool implementations
- `lib/agent/prompts/*` — agent loop prompts
- `app/api/agent/[sessionId]/stream/route.ts` — SSE streaming
- `components/agent/*` — agent execution UI
- `app/mission/`, `app/agent/`, `app/dashboard/`, `app/workspace/`, `app/memory/` — multi-screen pages

## Before You Start

1. Read `AGENTS.md` in full — it is the single source of truth for architecture and code
2. Read `SKILLS.md` for the implementation checklist
3. Read the plan at `.opencode/plans/opportunity-ai-implementation.md`
4. Verify all dependencies are installed: `npm install uuid framer-motion @tanstack/react-query`

## Implementation Order

Must follow this strict order:

```
Phase 4 (Database) → Phase 1c (Prompts) → Phase 1b (Tools)
  → Phase 1 (Agent Loop) → Phase 2 (SSE) → Phase 3 (UI)
  → Phase 5 (Pages) → Phase 6 (Landing) → Phase 7 (Seed) → Phase 8 (Final)
```

## Architecture Files

### Core Agent Files (`lib/agent/`)
- `types.ts` — TypeScript types: AgentPhase, AgentState, SSEEvent, Mission, AgentResult
- `engine.ts` — AutonomousAgent class with the Perceive→Reason→Plan→Tool→Execute→Observe→Memory loop
- `emit.ts` — SSEEmitter class for real-time SSE streaming
- `mission.ts` — Mission parsing and validation utilities
- `errors.ts` — Error recovery and fallback logic

### Tools (`lib/agent/tools/`)
- `base.ts` — AgentTool interface, ToolResult, ToolContext types
- `registry.ts` — ToolRegistry (maps name → AgentTool instance)
- `search.ts` — Database-backed opportunity search
- `eligibility.ts` — AI-powered eligibility analysis
- `rank.ts` — Match scoring and ranking
- `document.ts` — Application document generation
- `memory.ts` — Memory recall and store tools
- `web.ts` — Web search (mock for hackathon)
- `notify.ts` — Reminder scheduling

### Prompts (`lib/agent/prompts/`)
- `index.ts` — Barrel exports
- `system.ts` — Master system prompt for agent identity
- `reason.ts` — Chain-of-thought reasoning prompt
- `tool-select.ts` — Tool selection decision prompt
- `observe.ts` — Tool output interpretation prompt
- `memory-update.ts` — Memory storage decisions prompt

### Database (`lib/db/schema.ts`)
New tables: agent_missions, agent_iterations, agent_memories, applications, reminders

### Pages (`app/`)
- `page.tsx` — Updated landing page
- `mission/page.tsx` — Mission input
- `agent/[sessionId]/page.tsx` — Agent execution screen
- `dashboard/[sessionId]/page.tsx` — Mission dashboard
- `workspace/[sessionId]/page.tsx` — Opportunity workspace
- `memory/[sessionId]/page.tsx` — Agent memory

### API (`app/api/`)
- `agent/[sessionId]/stream/route.ts` — SSE streaming endpoint

## Agent Loop Pseudocode

```
function run():
  for iteration = 1 to maxIterations:
    // EMIT: phase = "perceive"
    perceive()
    
    // EMIT: phase = "reason", thought = reasoning
    reasoning = reason(lastResult)
    
    // EMIT: phase = "plan"
    toolChoice = selectTool(reasoning)
    
    // EMIT: tool_call = { tool, params }
    result = executeTool(toolChoice)
    
    // EMIT: tool_result = { tool, result }
    observations = observe(result)
    
    // EMIT: memory_update
    storeMemories(observations)
    
    // Save iteration to DB
    saveIteration()
    
    if missionComplete: break
  
  updateMissionStatus()
  // EMIT: complete
```

## Key Conventions

1. No `any` types — strict TypeScript
2. `"use client"` only when browser APIs or hooks are needed
3. Import order: React → Next → third-party → local `@/`
4. Component naming: PascalCase, one per file
5. Error boundaries on every page
6. Loading states via Suspense
7. Responsive design with Tailwind CSS v4

## Verification

After completing each phase, run:
```bash
npm run build    # Check TypeScript errors
npm run dev      # Verify dev server starts
```

After Phase 4 (Database):
```bash
npm run db:generate
npm run db:push
```

After Phase 7 (Seed):
```bash
npm run seed
```
