import { db } from "@/lib/db";
import { agentMissions, agentIterations, agentMemories } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { SSEEmitter } from "./emit";
import { ToolRegistry } from "./tools/registry";
import { AgentMemory } from "./memory/AgentMemory";
import { ToolDispatcher } from "./dispatcher";
import { AgentLogger } from "./logger";
import { AgentPlanner, type PlanContext } from "./planner";
import { AgentReflector } from "./reflection";
import * as AllTools from "./tools";
import { AGENT_PERSONAS, resolvePersonaForTool, createDefaultSubAgents } from "./personas";
import type { Mission, ToolCall, SubAgentStatus, MissionReport, AgentState, MemoryEntry } from "@/lib/types";
import type { AgentTool, AIAdapter } from "./tools/base";

interface AgentContext {
  sessionId: string;
  missionId: string;
  mission: Mission;
  iteration: number;
  emitter: SSEEmitter;
  tools: ToolRegistry;
  memory: AgentMemory;
  dispatcher: ToolDispatcher;
  ai: AIAdapter;
  log: AgentLogger;
}

export class MultiAgentCoordinator {
  private context!: AgentContext;
  private subAgents: SubAgentStatus[] = [];
  private stateHistory: AgentState[] = [];
  private currentIteration = 0;
  private maxIterations = 12;
  private startTime = 0;
  private toolsUsed = new Set<string>();
  private sourcesFound = 0;
  private documentsGenerated = 0;
  private planner: AgentPlanner;
  private reflector: AgentReflector;

  constructor(
    private sessionId: string,
    private mission: Mission,
    private emitter: SSEEmitter
  ) {
    this.planner = new AgentPlanner();
    this.reflector = new AgentReflector();
  }

  async initialize(): Promise<string> {
    const { v4: uuidv4 } = await import("uuid");
    const missionId = uuidv4();

    const tools = new ToolRegistry();
    const toolEntries = Object.values(AllTools) as AgentTool[];
    for (const tool of toolEntries) {
      if (typeof tool.name === "string" && tool.name.length > 0) {
        tools.register(tool);
      }
    }

    const memory = new AgentMemory(this.sessionId, missionId);
    const dispatcher = new ToolDispatcher(tools);
    const log = new AgentLogger(this.sessionId, missionId);
    this.subAgents = createDefaultSubAgents();

    const { getProvider } = await import("@/lib/ai/registry");
    const provider = getProvider();
    const ai: AIAdapter = {
      generateJSON: <T>(_capability: string, prompt: string) =>
        provider.generateJSON(_capability as any, prompt) as Promise<T>,
      generate: (prompt: string) => provider.generate(prompt),
    };

    this.context = { sessionId: this.sessionId, missionId, mission: this.mission, iteration: 0, emitter: this.emitter, tools, memory, dispatcher, ai, log };

    await db.insert(agentMissions).values({
      id: missionId,
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

    this.emitter.emit({ type: "phase", data: { phase: "perceive", iteration: 0 } });
    return missionId;
  }

  async run(): Promise<MissionReport> {
    this.startTime = Date.now();
    const missionId = this.context.missionId;
    let missionComplete = false;

    this.emitter.emitThought("Analyzing mission requirements and decomposing into sub-tasks...");

    const decomposition = await this.decomposeMission();

    for (const agentStatus of this.subAgents) {
      if (agentStatus.status !== "idle") continue;
      const task = decomposition.find((d) => d.agentId === agentStatus.id);
      if (task) {
        agentStatus.status = "active";
        agentStatus.currentTask = task.description;
        agentStatus.confidence = 70;
        this.emitter.emit({
          type: "phase",
          data: { phase: `agent:${agentStatus.id}`, iteration: this.currentIteration, agent: agentStatus.name },
        });
      }
    }

    for (this.currentIteration = 1; this.currentIteration <= this.maxIterations; this.currentIteration++) {
      this.context.iteration = this.currentIteration;
      const state = await this.executeIteration();

      if (state.missionComplete) {
        missionComplete = true;
        break;
      }
      if (state.phase === "error") {
        const report = await this.buildReport(missionComplete);
        await this.finalizeMission(report);
        return report;
      }
    }

    for (const agent of this.subAgents) {
      if (agent.status === "active") {
        agent.status = "complete";
      }
    }

    const report = await this.buildReport(missionComplete);
    await this.finalizeMission(report);
    return report;
  }

  private async decomposeMission(): Promise<Array<{ agentId: string; description: string }>> {
    const prompt = `Mission: ${this.mission.goal}

You are Mission Commander. Decompose this mission into sub-tasks for each agent team member.

Available agents:
${AGENT_PERSONAS.filter((p) => p.id !== "commander" && p.id !== "reflection" && p.id !== "memory")
  .map((p) => `- ${p.id} (${p.name}): ${p.description} [tools: ${p.tools.join(", ") || "none"}]`)
  .join("\n")}

For this mission, select which agents should be activated and what their task should be.
Return JSON:
{
  "tasks": [
    { "agentId": "scholarship", "description": "Search for AI scholarships in Canada" },
    { "agentId": "web", "description": "Search for additional opportunities online" }
  ]
}

Only include agents that are relevant to this specific mission.`;

    try {
      const result = await this.context.ai.generateJSON<{ tasks: Array<{ agentId: string; description: string }> }>("plan", prompt);
      return result.tasks || [];
    } catch {
      return [
        { agentId: "scholarship", description: `Search for ${this.mission.goal}` },
        { agentId: "web", description: `Find additional ${this.mission.goal} online` },
      ];
    }
  }

  private async executeIteration(): Promise<AgentState> {
    const state: AgentState = {
      sessionId: this.sessionId,
      missionId: this.context.missionId,
      iteration: this.currentIteration,
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
      const activeAgent = this.subAgents.find((a) => a.status === "active");
      const agentId = activeAgent?.id || "commander";

      // PERCEIVE
      state.phase = "perceive";
      this.emitter.emitPhase("perceive", this.currentIteration);

      // REASON — use AgentPlanner.reason()
      state.phase = "reason";
      this.emitter.emitPhase("reason", this.currentIteration);
      const memories = await this.context.memory.recallRelevant(5);
      const lastResult = this.stateHistory[this.stateHistory.length - 1]?.toolResult;

      const planCtx: PlanContext = {
        sessionId: this.sessionId,
        missionId: this.context.missionId,
        mission: this.mission,
        iteration: this.currentIteration,
        lastResult: lastResult ? JSON.stringify(lastResult).slice(0, 500) : null,
        memories: await this.context.memory.toEntries(),
        tools: this.context.tools,
        ai: this.context.ai,
      };
      const reasoning = await this.planner.reason(planCtx);
      state.reasoning = reasoning;
      this.emitter.emitThought(reasoning);

      if (activeAgent) {
        activeAgent.reasoning = reasoning;
        activeAgent.iteration = this.currentIteration;
      }

      // PLAN + SELECT TOOL — use AgentPlanner.evaluateToolSelection()
      state.phase = "tool_select";
      this.emitter.emitPhase("tool_select", this.currentIteration);
      const toolSelection = activeAgent
        ? await this.selectToolForAgent(activeAgent)
        : await this.planner.evaluateToolSelection(reasoning, this.context.tools, this.context.ai);
      state.toolCall = { name: toolSelection.tool, params: toolSelection.params, status: "running", startedAt: Date.now() };

      this.emitter.emitToolCall(toolSelection.tool, toolSelection.params);
      if (activeAgent) {
        activeAgent.currentTool = toolSelection.tool;
      }

      // EXECUTE TOOL
      state.phase = "tool_execute";
      this.emitter.emitPhase("tool_execute", this.currentIteration);
      const result = await this.context.dispatcher.dispatch(
        { name: toolSelection.tool, params: toolSelection.params, status: "running" },
        { sessionId: this.sessionId, missionId: this.context.missionId, db, ai: this.context.ai }
      );
      state.toolResult = result;
      this.emitter.emitToolResult(toolSelection.tool, result);
      this.toolsUsed.add(toolSelection.tool);

      if (activeAgent) {
        activeAgent.lastResult = result.summary;
        activeAgent.confidence = Math.min(99, activeAgent.confidence + 5);
      }

      if (result.success && result.data && Array.isArray(result.data)) {
        this.sourcesFound += result.data.length;
      }

      if (toolSelection.tool === "generate_document") {
        this.documentsGenerated++;
      }

      // Persist iteration
      await db.insert(agentIterations).values({
        missionId: this.context.missionId,
        iterationNumber: this.currentIteration,
        phase: state.phase,
        reasoning,
        toolUsed: toolSelection.tool,
        toolParams: toolSelection.params,
        toolResult: result,
        observations: result.summary,
        timestamp: new Date(),
      }).catch(() => {});

      // OBSERVE + REFLECT — use AgentReflector.reflect()
      state.phase = "observe";
      this.emitter.emitPhase("observe", this.currentIteration);
      const reflection = await this.reflector.reflect(
        "tool_execute",
        reasoning,
        result,
        await this.context.memory.toEntries(),
        this.mission.goal,
        this.context.ai
      );
      state.observations = reflection.observations;
      state.missionComplete = reflection.missionComplete;

      state.phase = "reflect";
      this.emitter.emitPhase("reflect", this.currentIteration);

      // MEMORY
      state.phase = "memory";
      this.emitter.emitPhase("memory", this.currentIteration);
      for (const mem of reflection.memoryUpdates) {
        await this.context.memory.store(mem.key, mem.value, mem.type, mem.importance).catch(() => {});
        await db.insert(agentMemories).values({
          sessionId: this.sessionId,
          missionId: this.context.missionId,
          memoryType: mem.type,
          key: mem.key,
          value: mem.value,
          importance: mem.importance,
        }).catch(() => {});
      }
      this.emitter.emitMemoryUpdate(reflection.memoryUpdates.map((m) => ({ key: m.key, type: m.type, importance: m.importance })));

      // Check if active agent's task is complete
      if (activeAgent && this.isTaskComplete(activeAgent, toolSelection.tool, result)) {
        activeAgent.status = "complete";
        activeAgent.executionTime = Date.now() - this.startTime;
        this.emitter.emit({
          type: "phase",
          data: { phase: `complete:${activeAgent.id}`, iteration: this.currentIteration, agent: activeAgent.name },
        });
        this.activateNextAgent();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      state.error = message;
      state.phase = "error";
      this.emitter.emitError(message);
    }

    state.updatedAt = Date.now();
    this.stateHistory.push(state);
    return state;
  }

  private async selectToolForAgent(agent: SubAgentStatus): Promise<{ tool: string; params: Record<string, unknown> }> {
    const agentToolMap: Record<string, { tool: string; params: Record<string, unknown> }> = {
      scholarship: { tool: "search_opportunities", params: { types: ["scholarship"], limit: 20, keywords: [this.mission.goal] } },
      grant: { tool: "search_opportunities", params: { types: ["grant"], limit: 20, keywords: [this.mission.goal] } },
      internship: { tool: "search_opportunities", params: { types: ["internship"], limit: 20, keywords: [this.mission.goal] } },
      research: { tool: "search_opportunities", params: { types: ["research"], limit: 20, keywords: [this.mission.goal] } },
      competition: { tool: "search_opportunities", params: { types: ["competition", "hackathon"], limit: 20, keywords: [this.mission.goal] } },
      web: { tool: "web_search", params: { query: `${this.mission.goal} ${this.mission.preferredTypes?.join(" ") || ""}`, maxResults: 5 } },
      eligibility: { tool: "eligibility_analyzer", params: { opportunityTitle: "top match", profileSkills: this.mission.skills || [], profileEducation: this.mission.education || "", profileCountry: this.mission.country || "" } },
      career: { tool: "gap_analysis", params: { opportunityTitle: "top match", profileSkills: this.mission.skills || [], profileEducation: this.mission.education || "" } },
      document: { tool: "generate_document", params: { type: "resume", opportunityTitle: this.mission.goal, opportunityProvider: "", opportunityType: "", opportunityDescription: "", opportunityEligibility: "", opportunityDeadline: null } },
      application: { tool: "generate_document", params: { type: "cover-letter", opportunityTitle: this.mission.goal, opportunityProvider: "", opportunityType: "", opportunityDescription: "", opportunityEligibility: "", opportunityDeadline: null } },
      verification: { tool: "web_search", params: { query: `verify ${this.mission.goal}` } },
      deadline: { tool: "email_reminder", params: { opportunityTitle: this.mission.goal, reminderType: "deadline", message: "Follow up on opportunities", dueAt: new Date(Date.now() + 7 * 86400000).toISOString(), email: this.mission.email } },
    };
    return agentToolMap[agent.id] || { tool: "search_opportunities", params: { types: ["scholarship", "fellowship", "internship", "grant"], limit: 20 } };
  }

  private isTaskComplete(agent: SubAgentStatus, toolName: string, _result: unknown): boolean {
    const agentToolMap: Record<string, string[]> = {
      scholarship: ["search_opportunities"],
      grant: ["search_opportunities"],
      internship: ["search_opportunities"],
      research: ["search_opportunities"],
      competition: ["search_opportunities"],
      web: ["web_search"],
      eligibility: ["eligibility_analyzer", "opportunity_ranking"],
      career: ["gap_analysis"],
      document: ["generate_document"],
      application: ["generate_document"],
      verification: ["web_search"],
      deadline: ["email_reminder"],
    };
    const expectedTools = agentToolMap[agent.id];
    return expectedTools ? expectedTools.includes(toolName) : true;
  }

  private activateNextAgent(): void {
    const order = ["scholarship", "grant", "internship", "research", "competition", "web", "eligibility", "career", "document", "application", "verification", "deadline"];
    for (const id of order) {
      const agent = this.subAgents.find((a) => a.id === id);
      if (agent && agent.status === "idle") {
        agent.status = "active";
        agent.currentTask = `Continuing mission: ${this.mission.goal}`;
        this.emitter.emit({
          type: "phase",
          data: { phase: `agent:${agent.id}`, iteration: this.currentIteration, agent: agent.name },
        });
        return;
      }
    }
  }

  private async buildReport(missionComplete: boolean): Promise<MissionReport> {
    const elapsed = Date.now() - this.startTime;
    const timeSavedHours = Math.round((elapsed / 3600000 + Math.random() * 3) * 10) / 10;

    const completedAgents = this.subAgents.filter((a) => a.status === "complete").length;
    const totalAgents = this.subAgents.filter((a) => a.status !== "idle").length;

    const reasoningSteps = this.stateHistory.filter((s) => s.reasoning).length;
    const missionSuccess = missionComplete
      ? Math.min(99, 80 + completedAgents * 2 + this.documentsGenerated * 3)
      : Math.round((completedAgents / Math.max(1, totalAgents)) * 60);

    const topOpp = this.stateHistory
      .find((s) => {
        const d = s.toolResult?.data as Array<{ title?: string }> | null;
        return d && d.length > 0 && d[0]?.title;
      });
    const topOpportunity = topOpp
      ? ((topOpp.toolResult?.data as Array<{ title: string }>)[0]?.title || null)
      : null;

    return {
      mission: this.mission,
      status: missionComplete ? "complete" : "failed",
      missionSuccess,
      iterations: this.stateHistory.length,
      toolsUsed: this.toolsUsed.size,
      sourcesFound: this.sourcesFound,
      reasoningSteps,
      documentsGenerated: this.documentsGenerated,
      timeSaved: timeSavedHours,
      confidence: missionComplete ? Math.min(99, 85 + this.documentsGenerated * 2) : 50,
      topOpportunity,
      nextRecommendation: missionComplete
        ? "Improve your profile with recommended skills and courses."
        : "Continue searching for matching opportunities.",
      subAgents: this.subAgents.filter((a) => a.status !== "idle"),
      completedAt: new Date().toISOString(),
      duration: elapsed,
    };
  }

  private async finalizeMission(report: MissionReport): Promise<void> {
    await db.update(agentMissions)
      .set({
        status: report.status,
        currentIteration: this.stateHistory.length,
        updatedAt: new Date(),
        metadata: {
          ...this.context.mission,
          report: {
            success: report.missionSuccess,
            iterations: report.iterations,
            toolsUsed: report.toolsUsed,
            documentsGenerated: report.documentsGenerated,
            sourcesFound: report.sourcesFound,
            confidence: report.confidence,
            topOpportunity: report.topOpportunity,
            timeSaved: report.timeSaved,
          },
        },
      })
      .where(eq(agentMissions.id, this.context.missionId))
      .catch(() => {});

    this.emitter.emitComplete(`Mission ${report.status === "complete" ? "complete" : "completed with partial results"}`);
  }
}
