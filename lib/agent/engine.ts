import { db } from "@/lib/db";
import { agentMissions, agentIterations, agentMemories } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { SSEEmitter } from "./emit";
import { ToolRegistry } from "./tools/registry";
import { AgentStateMachine } from "./state/AgentStateMachine";
import { AgentEventBus } from "./events/AgentEventBus";
import { AgentMemory } from "./memory/AgentMemory";
import { AgentLogger } from "./logger";
import { AgentPlanner } from "./planner";
import { ToolDispatcher } from "./dispatcher";
import { AgentReflector } from "./reflection";
import { logger } from "@/lib/logger";
import * as AllTools from "./tools";
import type { Mission, AgentState, AgentSummary, ToolCall } from "@/lib/types";
import type { AgentTool, AIAdapter } from "./tools/base";

export class AutonomousAgent {
  private mission: Mission;
  private emitter: SSEEmitter;
  private tools: ToolRegistry;
  private sessionId: string;
  private missionId: string = "";
  private iteration = 0;
  private maxIterations = 15;
  private stateHistory: AgentState[] = [];
  private stateMachine: AgentStateMachine;
  private eventBus: AgentEventBus;
  private memory: AgentMemory;
  private log: AgentLogger;
  private planner: AgentPlanner;
  private dispatcher: ToolDispatcher;
  private reflector: AgentReflector;
  private ai: AIAdapter | null = null;

  constructor(sessionId: string, mission: Mission, emitter: SSEEmitter) {
    this.sessionId = sessionId;
    this.mission = mission;
    this.emitter = emitter;
    this.tools = new ToolRegistry();
    this.stateMachine = new AgentStateMachine();
    this.eventBus = new AgentEventBus();
    this.memory = new AgentMemory(sessionId);
    this.log = new AgentLogger(sessionId, this.missionId);
    this.planner = new AgentPlanner();
    this.dispatcher = new ToolDispatcher(this.tools);
    this.reflector = new AgentReflector();
  }

  registerTool(tool: AgentTool): void {
    this.tools.register(tool);
  }

  registerAllTools(): void {
    const toolEntries = Object.values(AllTools) as AgentTool[];
    for (const tool of toolEntries) {
      if (typeof tool.name === "string" && tool.name.length > 0) {
        this.tools.register(tool);
      }
    }
    logger.info(`Registered ${this.tools.list().length} tools`);
  }

  setAIAdapter(adapter: AIAdapter): void {
    this.ai = adapter;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getMissionId(): string {
    return this.missionId;
  }

  getTools(): ToolRegistry {
    return this.tools;
  }

  getEmitter(): SSEEmitter {
    return this.emitter;
  }

  getStateMachine(): AgentStateMachine {
    return this.stateMachine;
  }

  getEventBus(): AgentEventBus {
    return this.eventBus;
  }

  getMemory(): AgentMemory {
    return this.memory;
  }

  getLogger(): AgentLogger {
    return this.log;
  }

  async initialize(): Promise<string> {
    const { v4: uuidv4 } = await import("uuid");
    this.missionId = uuidv4();
    this.log = new AgentLogger(this.sessionId, this.missionId);
    this.memory = new AgentMemory(this.sessionId, this.missionId);

    await db.insert(agentMissions).values({
      id: this.missionId,
      sessionId: this.sessionId,
      goal: this.mission.goal,
      status: "running",
      preferredTypes: this.mission.preferredTypes,
      preferredRegions: this.mission.preferredRegions,
      metadata: {
        education: this.mission.education,
        skills: this.mission.skills,
        country: this.mission.country,
        careerGoal: this.mission.careerGoal,
      },
    });

    logger.info(`Agent initialized`, { sessionId: this.sessionId, missionId: this.missionId, goal: this.mission.goal });
    return this.missionId;
  }

  async run(): Promise<AgentSummary> {
    const startTime = Date.now();
    logger.info(`Agent starting mission`, { goal: this.mission.goal });

    if (!this.ai) {
      try {
        const { getProvider } = await import("@/lib/ai/registry");
        const provider = getProvider();
        this.ai = {
          generateJSON: <T>(_capability: string, prompt: string) =>
            provider.generateJSON<T>(
              _capability as import("@/lib/ai/provider").AICapability,
              prompt
            ),
          generate: (prompt: string) => provider.generate(prompt),
        };
      } catch (providerErr) {
        const msg = `AI provider failed to initialize: ${providerErr instanceof Error ? providerErr.message : String(providerErr)}`;
        logger.error(msg);
        this.emitter.error(msg);
        return {
          mission: this.mission,
          iterations: 0,
          duration: Date.now() - startTime,
          matches: 0,
          documents: 0,
          memories: 0,
        };
      }
    }

    for (this.iteration = 1; this.iteration <= this.maxIterations; this.iteration++) {
      const phaseState = await this.executeIteration();
      this.stateHistory.push(phaseState);
      this.eventBus.phase(phaseState.phase, this.iteration);
      this.emitter.phase(phaseState.phase, this.iteration);

      if (phaseState.missionComplete) {
        this.stateMachine.transition("complete");
        break;
      }
      if (phaseState.phase === "error") {
        this.stateMachine.transition("error");
        break;
      }
    }

    const summary: AgentSummary = {
      mission: this.mission,
      iterations: this.stateHistory.length,
      duration: Date.now() - startTime,
      matches: this.stateHistory.filter((s) => {
        const r = s.toolResult as { success?: boolean; data?: unknown; metadata?: { count?: number } } | null;
        return r?.metadata?.count && r.metadata.count > 0;
      }).length,
      documents: this.stateHistory.filter((s) => {
        const r = s.toolResult as { success?: boolean; metadata?: { type?: string } } | null;
        return r?.metadata?.type?.startsWith("resume") || r?.metadata?.type?.startsWith("cover");
      }).length,
      memories: this.stateHistory.filter((s) => s.phase === "memory").length,
    };

    await db.update(agentMissions)
      .set({ status: "complete", currentIteration: this.stateHistory.length, updatedAt: new Date() })
      .where(eq(agentMissions.id, this.missionId));

    this.emitter.complete(`Mission complete after ${this.stateHistory.length} iterations`);
    logger.info(`Agent mission complete`, summary);

    return summary;
  }

  private async executeIteration(): Promise<AgentState> {
    const state: AgentState = {
      sessionId: this.sessionId,
      missionId: this.missionId,
      iteration: this.iteration,
      phase: "perceive",
      mission: this.mission,
      reasoning: "",
      toolCall: null,
      toolResult: null,
      observations: "",
      missionComplete: false,
      error: null,
      startedAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      // Phase 1: PERCEIVE
      this.stateMachine.transition("perceive");
      state.phase = "perceive";
      this.emitter.phase("perceive", this.iteration);
      this.log.info("perceive", this.iteration, "Perceiving mission context");

      // Phase 2: REASON
      this.stateMachine.transition("reason");
      state.phase = "reason";
      this.emitter.phase("reason", this.iteration);
      const memories = await this.memory.recallRelevant(5);
      const lastResult = this.stateHistory[this.stateHistory.length - 1]?.toolResult;
      const reasoning = await this.planner.reason({
        sessionId: this.sessionId,
        missionId: this.missionId,
        mission: this.mission,
        iteration: this.iteration,
        lastResult: lastResult ? JSON.stringify(lastResult) : null,
        memories: await this.memory.toEntries(),
        tools: this.tools,
        ai: this.ai!,
      });
      state.reasoning = reasoning;
      this.eventBus.thought(reasoning, this.iteration);
      this.emitter.thought(reasoning);
      this.log.info("reason", this.iteration, "Reasoning completed", { reasoning: reasoning.slice(0, 100) });

      // Phase 3: PLAN
      this.stateMachine.transition("plan");
      state.phase = "plan";
      this.emitter.phase("plan", this.iteration);

      // Phase 4: SELECT TOOL
      this.stateMachine.transition("tool_select");
      state.phase = "tool_select";
      this.emitter.phase("tool_select", this.iteration);
      const toolSelection = await this.planner.evaluateToolSelection(
        reasoning,
        this.tools,
        this.ai!
      );

      const toolCall: ToolCall = {
        name: toolSelection.tool,
        params: toolSelection.params,
        status: "running",
        startedAt: Date.now(),
      };
      state.toolCall = toolCall;
      this.eventBus.toolCall(toolSelection.tool, toolSelection.params, this.iteration);
      this.emitter.toolCall(toolSelection.tool, toolSelection.params);
      this.log.info("tool_select", this.iteration, `Selected tool: ${toolSelection.tool}`, toolSelection.params);

      // Phase 5: EXECUTE TOOL
      this.stateMachine.transition("tool_execute");
      state.phase = "tool_execute";
      this.emitter.phase("tool_execute", this.iteration);
      const result = await this.dispatcher.dispatch(toolCall, {
        sessionId: this.sessionId,
        missionId: this.missionId,
        db,
        ai: this.ai!,
      });
      state.toolResult = result;
      toolCall.status = result.success ? "success" : "error";
      toolCall.completedAt = Date.now();
      this.eventBus.toolResult(toolSelection.tool, result, this.iteration);
      this.emitter.toolResult(toolSelection.tool, result);
      this.log.info("tool_execute", this.iteration, `Tool ${toolSelection.tool} completed`, { success: result.success, summary: result.summary });

      // Phase 6: OBSERVE
      this.stateMachine.transition("observe");
      state.phase = "observe";
      this.emitter.phase("observe", this.iteration);
      const reflection = await this.reflector.reflect(
        "tool_execute",
        reasoning,
        result,
        await this.memory.toEntries(),
        this.mission.goal,
        this.ai!
      );
      state.observations = reflection.observations;
      state.missionComplete = reflection.missionComplete;
      this.log.info("observe", this.iteration, "Observation completed", { missionComplete: reflection.missionComplete });

      // Persist iteration to DB
      try {
        await db.insert(agentIterations).values({
          missionId: this.missionId,
          iterationNumber: this.iteration,
          phase: state.phase,
          reasoning,
          toolUsed: toolSelection.tool,
          toolParams: toolSelection.params,
          toolResult: result,
          observations: reflection.observations,
          timestamp: new Date(),
        });
      } catch (dbErr) {
        logger.warn("Failed to persist iteration", { error: dbErr });
      }

      // Phase 7: REFLECT
      this.stateMachine.transition("reflect");
      state.phase = "reflect";
      this.emitter.phase("reflect", this.iteration);

      // Phase 8: UPDATE MEMORY
      this.stateMachine.transition("memory");
      state.phase = "memory";
      this.emitter.phase("memory", this.iteration);
      for (const mem of reflection.memoryUpdates) {
        await this.memory.store(mem.key, mem.value, mem.type, mem.importance);
        // Persist to DB
        try {
          await db.insert(agentMemories).values({
            sessionId: this.sessionId,
            missionId: this.missionId,
            memoryType: mem.type,
            key: mem.key,
            value: mem.value,
            importance: mem.importance,
          });
        } catch (dbErr) {
          logger.warn("Failed to persist memory", { error: dbErr });
        }
      }
      const memStats = await this.memory.getStats();
      this.eventBus.memoryUpdate(
        reflection.memoryUpdates.map((m) => ({ key: m.key, type: m.type, importance: m.importance })),
        this.iteration
      );
      this.emitter.memoryUpdate(
        reflection.memoryUpdates.map((m) => ({ key: m.key, type: m.type, importance: m.importance }))
      );
      this.log.info("memory", this.iteration, `Memory updated: ${reflection.memoryUpdates.length} new entries`, memStats);

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      state.error = message;
      state.phase = "error";
      this.emitter.phase("error", this.iteration);
      this.eventBus.error(message, this.iteration);
      this.emitter.error(message);
      this.log.error("executeIteration", this.iteration, `Iteration failed: ${message}`, error);

      try {
        await db.update(agentMissions)
          .set({ status: "failed", updatedAt: new Date() })
          .where(eq(agentMissions.id, this.missionId));
      } catch { /* ignore */ }
    }

    state.updatedAt = Date.now();
    return state;
  }
}
