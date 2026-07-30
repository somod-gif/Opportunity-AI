import type { AgentEvent, AgentPhase, MemoryType } from "@/lib/types";

export type EventCallback = (event: AgentEvent) => void;
export type EventFilter = (event: AgentEvent) => boolean;

export class AgentEventBus {
  private listeners = new Map<string, Set<EventCallback>>();
  private history: AgentEvent[] = [];
  private maxHistory = 500;

  on(type: string, callback: EventCallback): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);
    return () => {
      this.listeners.get(type)?.delete(callback);
    };
  }

  off(type: string, callback: EventCallback): void {
    this.listeners.get(type)?.delete(callback);
  }

  emit(event: AgentEvent): void {
    this.history.push(event);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    const callbacks = this.listeners.get(event.type);
    if (callbacks) {
      for (const cb of callbacks) {
        try {
          cb(event);
        } catch {
          // prevent one bad listener from breaking others
        }
      }
    }
  }

  phase(phase: AgentPhase, iteration: number, data?: Record<string, unknown>): void {
    this.emit({
      type: "phase",
      data: { phase, iteration, ...data },
      timestamp: Date.now(),
    });
  }

  thought(content: string, iteration?: number): void {
    this.emit({
      type: "thought",
      data: { content, iteration },
      timestamp: Date.now(),
    });
  }

  toolCall(tool: string, params: unknown, iteration?: number): void {
    this.emit({
      type: "tool_call",
      data: { tool, params, iteration },
      timestamp: Date.now(),
    });
  }

  toolResult(tool: string, result: unknown, iteration?: number): void {
    this.emit({
      type: "tool_result",
      data: { tool, result, iteration },
      timestamp: Date.now(),
    });
  }

  memoryUpdate(
    memories: Array<{ key: string; type: MemoryType; importance: number }>,
    iteration?: number
  ): void {
    this.emit({
      type: "memory",
      data: { memories, iteration },
      timestamp: Date.now(),
    });
  }

  error(error: string, iteration?: number): void {
    this.emit({
      type: "error",
      data: { error, iteration },
      timestamp: Date.now(),
    });
  }

  complete(summary: string): void {
    this.emit({
      type: "complete",
      data: { summary },
      timestamp: Date.now(),
    });
  }

  getHistory(filter?: EventFilter): AgentEvent[] {
    if (filter) return this.history.filter(filter);
    return [...this.history];
  }

  getRecent(count = 10): AgentEvent[] {
    return this.history.slice(-count);
  }

  clear(): void {
    this.history = [];
  }
}
