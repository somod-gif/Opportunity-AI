export type AgentPhase =
  | "idle"
  | "perceive"
  | "reason"
  | "plan"
  | "tool_select"
  | "tool_execute"
  | "observe"
  | "reflect"
  | "memory"
  | "complete"
  | "error";

export type MemoryType = "episodic" | "semantic" | "procedural";

export type ToolStatus = "pending" | "running" | "success" | "error";

export interface Mission {
  goal: string;
  education?: string;
  skills?: string[];
  country?: string;
  careerGoal?: string;
  experienceLevel?: string;
  preferredTypes?: string[];
  preferredRegions?: string[];
}

export interface AgentState {
  sessionId: string;
  missionId: string;
  iteration: number;
  phase: AgentPhase;
  mission: Mission;
  reasoning: string;
  toolCall: ToolCall | null;
  toolResult: ToolResult | null;
  observations: string;
  missionComplete: boolean;
  error: string | null;
  startedAt: number;
  updatedAt: number;
}

export interface ToolCall {
  name: string;
  params: Record<string, unknown>;
  status: ToolStatus;
  startedAt?: number;
  completedAt?: number;
}

export interface ToolResult {
  success: boolean;
  data: unknown;
  summary: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface MemoryEntry {
  id: string;
  sessionId: string;
  missionId?: string;
  memoryType: MemoryType;
  key: string;
  value: string;
  importance: number;
  accessCount: number;
  createdAt: number;
  lastAccessed: number;
}

export interface AgentEvent {
  type: "phase" | "thought" | "tool_call" | "tool_result" | "memory" | "error" | "complete";
  data: unknown;
  timestamp: number;
}

export interface AgentSummary {
  mission: Mission;
  iterations: number;
  duration: number;
  matches: number;
  documents: number;
  memories: number;
}

export interface SubAgentStatus {
  id: string;
  name: string;
  role: string;
  status: "idle" | "active" | "complete" | "error";
  confidence: number;
  currentTask: string;
  currentTool: string;
  reasoning: string;
  lastResult: string;
  executionTime: number;
  iteration: number;
}

export interface MissionReport {
  mission: Mission;
  status: "running" | "complete" | "failed";
  missionSuccess: number;
  iterations: number;
  toolsUsed: number;
  sourcesFound: number;
  reasoningSteps: number;
  documentsGenerated: number;
  timeSaved: number;
  confidence: number;
  topOpportunity: string | null;
  nextRecommendation: string;
  subAgents: SubAgentStatus[];
  completedAt: string;
  duration: number;
}

export interface KnowledgeNode {
  id: string;
  label: string;
  type: "user" | "skill" | "goal" | "country" | "organization" | "opportunity" | "document" | "mission";
  connections: string[];
}
