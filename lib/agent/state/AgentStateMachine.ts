import type { AgentPhase } from "@/lib/types";

interface Transition {
  from: AgentPhase[];
  to: AgentPhase[];
}

const TRANSITIONS: Transition[] = [
  { from: ["idle"], to: ["perceive"] },
  { from: ["perceive"], to: ["reason"] },
  { from: ["reason"], to: ["plan"] },
  { from: ["plan"], to: ["tool_select"] },
  { from: ["tool_select"], to: ["tool_execute"] },
  { from: ["tool_execute"], to: ["observe"] },
  { from: ["observe"], to: ["reflect"] },
  { from: ["reflect"], to: ["memory", "reason"] },
  { from: ["memory"], to: ["complete", "perceive"] },
  { from: ["complete"], to: ["idle"] },
  { from: ["error"], to: ["idle", "perceive"] },
];

function isValidTransition(from: AgentPhase, to: AgentPhase): boolean {
  return TRANSITIONS.some(
    (t) => t.from.includes(from) && t.to.includes(to)
  );
}

export class AgentStateMachine {
  private current: AgentPhase = "idle";
  private previous: AgentPhase = "idle";
  private history: Array<{ phase: AgentPhase; timestamp: number }> = [];
  private listeners = new Set<(phase: AgentPhase) => void>();

  get phase(): AgentPhase {
    return this.current;
  }

  get previousPhase(): AgentPhase {
    return this.previous;
  }

  transition(to: AgentPhase): boolean {
    if (this.current === to) return true;
    if (!isValidTransition(this.current, to)) {
      console.warn(
        `Invalid transition: ${this.current} -> ${to}. Allowed: ${TRANSITIONS.filter((t) => t.from.includes(this.current)).flatMap((t) => t.to).join(", ")}`
      );
      return false;
    }
    this.previous = this.current;
    this.current = to;
    this.history.push({ phase: to, timestamp: Date.now() });
    for (const listener of this.listeners) {
      listener(to);
    }
    return true;
  }

  canTransition(to: AgentPhase): boolean {
    return isValidTransition(this.current, to);
  }

  reset(): void {
    this.previous = this.current;
    this.current = "idle";
    this.history = [];
  }

  onTransition(callback: (phase: AgentPhase) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  getHistory(): Array<{ phase: AgentPhase; timestamp: number }> {
    return [...this.history];
  }

  isInPhase(...phases: AgentPhase[]): boolean {
    return phases.includes(this.current);
  }
}
