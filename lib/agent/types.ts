import type {
  AgentPhase,
  AgentState,
  Mission,
  ToolCall,
  ToolResult,
  MemoryEntry,
  AgentEvent,
  AgentSummary,
  MemoryType,
} from "@/lib/types";

export type {
  AgentPhase,
  AgentState,
  Mission,
  ToolCall,
  ToolResult,
  MemoryEntry,
  AgentEvent,
  AgentSummary,
  MemoryType,
};

export interface ExecutionContext {
  sessionId: string;
  missionId: string;
  mission: Mission;
  iteration: number;
  memory: MemoryEntry[];
  toolRegistry: import("./tools/registry").ToolRegistry;
  emit: import("./emit").SSEEmitter;
}

export interface AgentPlanner {
  plan(context: ExecutionContext): Promise<AgentPlan>;
}

export interface AgentPlan {
  phase: AgentPhase;
  reasoning: string;
  toolName?: string;
  toolParams?: Record<string, unknown>;
  memoryUpdates?: Array<{
    key: string;
    value: string;
    type: MemoryType;
    importance: number;
  }>;
}

export interface AgentReasoner {
  reason(context: ExecutionContext): Promise<string>;
}

export interface AgentObserver {
  observe(
    toolName: string,
    result: ToolResult,
    context: ExecutionContext
  ): Promise<{
    observations: string;
    missionComplete: boolean;
    remainingGaps: string[];
  }>;
}
