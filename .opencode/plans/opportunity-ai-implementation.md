# Opportunity AI — Implementation Plan

## Objective

Transform the existing Opportunity AI batch pipeline into a true **autonomous AI agent** with visible reasoning, dynamic tool use, persistent memory, and real-time streaming — targeting the **Best Autonomous AI Agent** award at the Build with Gemma: AI for Africa Hackathon 2026.

---

## Phases

### Phase 4: Database Schema Expansion
**Status:** Pending | **Effort:** 4h | **Dependencies:** None

**Task 4.1:** Add `integer` and `doublePrecision` imports to `lib/db/schema.ts`
**Task 4.2:** Create `agentMissions` table
**Task 4.3:** Create `agentIterations` table
**Task 4.4:** Create `agentMemories` table
**Task 4.5:** Create `applications` table
**Task 4.6:** Create `reminders` table
**Task 4.7:** Export new TypeScript types
**Task 4.8:** Run `npm run db:generate && npm run db:push`

**Verification:** Schema compiles, DB migrations run without errors.

---

### Phase 1c: Prompt Architecture
**Status:** Pending | **Effort:** 4h | **Dependencies:** None

**Task 1c.1:** Create `lib/agent/prompts/index.ts` — barrel exports
**Task 1c.2:** Create `lib/agent/prompts/system.ts` — `buildSystemPrompt()`
**Task 1c.3:** Create `lib/agent/prompts/reason.ts` — `buildReasonPrompt()`
**Task 1c.4:** Create `lib/agent/prompts/tool-select.ts` — `buildToolSelectPrompt()`
**Task 1c.5:** Create `lib/agent/prompts/observe.ts` — `buildObservePrompt()`
**Task 1c.6:** Create `lib/agent/prompts/memory-update.ts` — `buildMemoryUpdatePrompt()`

**Verification:** All prompt files compile, no TypeScript errors.

---

### Phase 1b: Tool Architecture
**Status:** Pending | **Effort:** 6h | **Dependencies:** Phase 1c

**Task 1b.1:** Create `lib/agent/tools/base.ts` — `AgentTool` interface, `ToolResult`, `ToolContext`
**Task 1b.2:** Create `lib/agent/tools/registry.ts` — `ToolRegistry` class
**Task 1b.3:** Create `lib/agent/tools/search.ts` — `searchOpportunitiesTool`
**Task 1b.4:** Create `lib/agent/tools/eligibility.ts` — `analyzeEligibilityTool`
**Task 1b.5:** Create `lib/agent/tools/rank.ts` — `rankOpportunitiesTool`
**Task 1b.6:** Create `lib/agent/tools/document.ts` — `generateDocumentTool`
**Task 1b.7:** Create `lib/agent/tools/memory.ts` — `memoryRecallTool`, `memoryStoreTool`
**Task 1b.8:** Create `lib/agent/tools/web.ts` — `webSearchTool` (mock for hackathon)
**Task 1b.9:** Create `lib/agent/tools/notify.ts` — `setReminderTool`
**Task 1b.10:** Create `lib/agent/tools/index.ts` — barrel exports

**Verification:** All tools compile, registry test works.

---

### Phase 1: Agent Loop Engine
**Status:** Pending | **Effort:** 24h | **Dependencies:** Phase 1b, Phase 1c, Phase 4

**Task 1.1:** Create `lib/agent/types.ts` — `AgentPhase`, `AgentState`, `SSEEvent`, `Mission`, `AgentResult`
**Task 1.2:** Create `lib/agent/emit.ts` — `SSEEmitter` class
**Task 1.3:** Create `lib/agent/engine.ts` — `AutonomousAgent` class with loop
**Task 1.4:** Create `lib/agent/mission.ts` — mission parsing utility
**Task 1.5:** Create `lib/agent/errors.ts` — error recovery logic

**Verification:** Agent loop compiles, can be instantiated.

---

### Phase 2: Real-time SSE Streaming
**Status:** Pending | **Effort:** 8h | **Dependencies:** Phase 1

**Task 2.1:** Create directory `app/api/agent/[sessionId]/stream/`
**Task 2.2:** Create `route.ts` — SSE GET handler
**Task 2.3:** Wire `SSEEmitter` to the agent
**Task 2.4:** Test SSE stream with curl or browser

**Verification:** `curl http://localhost:3000/api/agent/test/stream?goal="test"` returns SSE events.

---

### Phase 3: Agent Execution Screen
**Status:** Pending | **Effort:** 8h | **Dependencies:** Phase 2

**Task 3.1:** Create `components/agent/execution-screen.tsx`
**Task 3.2:** Create `components/agent/phase-indicator.tsx`
**Task 3.3:** Create `components/agent/thought-stream.tsx`
**Task 3.4:** Create `components/agent/tool-call-card.tsx`
**Task 3.5:** Create `components/agent/tool-result-card.tsx`
**Task 3.6:** Create `components/agent/memory-toast.tsx`

**Verification:** UI renders SSE events in real-time with typewriter animation.

---

### Phase 5: Multi-Screen Pages
**Status:** Pending | **Effort:** 8h | **Dependencies:** Phase 3

**Task 5.1:** Create `app/mission/page.tsx`
**Task 5.2:** Create `app/agent/[sessionId]/page.tsx`
**Task 5.3:** Create `app/dashboard/[sessionId]/page.tsx`
**Task 5.4:** Create `app/workspace/[sessionId]/page.tsx`
**Task 5.5:** Create `app/memory/[sessionId]/page.tsx`
**Task 5.6:** Create `app/api/agent/[sessionId]/route.ts` — status/meta API

**Verification:** All routes render, navigation between pages works.

---

### Phase 6: Landing Page Redesign
**Status:** Pending | **Effort:** 4h | **Dependencies:** None

**Task 6.1:** Update `app/page.tsx` — premium hero, features, how it works
**Task 6.2:** Create `components/landing/hero.tsx` — animated section
**Task 6.3:** Create `components/landing/mission-input.tsx` — single textarea

**Verification:** Landing page renders with premium look, mission input works.

---

### Phase 7: Seed Data Expansion
**Status:** Pending | **Effort:** 4h | **Dependencies:** Phase 4

**Task 7.1:** Expand `scripts/seed.ts` from 7 to 25-30 opportunities
**Task 7.2:** Cover all 10 types (scholarship, fellowship, job, internship, grant, accelerator, competition, conference, research, hackathon)
**Task 7.3:** Add providers: DAAD, Chevening, Commonwealth, Erasmus+, Google, Microsoft, UN, African Union
**Task 7.4:** Run seed script and verify

**Verification:** DB has 25-30 opportunities across all types and providers.

---

### Phase 8: Dashboard + Workspace + Memory Pages
**Status:** Pending | **Effort:** 6h | **Dependencies:** Phase 5

**Task 8.1:** Implement full `DashboardPage` with status, tasks, next actions, discoveries
**Task 8.2:** Implement full `WorkspacePage` with filters, grid, bulk actions
**Task 8.3:** Implement full `MemoryPage` with timeline, search, categories
**Task 8.4:** Connect all pages to real agent data from DB

**Verification:** All pages display real data, interactions work end-to-end.

---

## Dependency Graph

```
Phase 4 (DB Schema) ──────────────────────────────────────┐
                                                           │
Phase 1c (Prompts) ──┐                                    │
                     ├── Phase 1b (Tools) ──┐              │
                     │                      ├── Phase 1    │
                     │                      │   (Engine)   │
                     └──────────────────────┘              │
                                                           │
Phase 1 (Engine) ── Phase 2 (SSE) ── Phase 3 (UI) ──┐     │
                                                      │     │
Phase 5 (Pages) ◄─────────────────────────────────────┘     │
                                                           │
Phase 6 (Landing) ◄─────── (independent)                   │
                                                           │
Phase 7 (Seed) ◄──────────────────────────────────────────┘
                                                           │
Phase 8 (Final) ◄──────────────────────────────────────────┘
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| SSE not working in Next.js | Fall back to polling every 2 seconds |
| Gemma API rate limits | Cache responses, mock tools for demo |
| DB migration conflicts | Backup schema before changes, test on fresh DB |
| Build errors | Run `npm run build` after each phase |
| Missing dependencies | `npm install uuid framer-motion @tanstack/react-query` |
