import type { AgentEvent } from "@/lib/types";

export class SSEEmitter {
  private controller: ReadableStreamDefaultController | null = null;
  private encoder = new TextEncoder();

  connect(controller: ReadableStreamDefaultController): void {
    this.controller = controller;
  }

  disconnect(): void {
    this.controller = null;
  }

  private send(event: AgentEvent): void {
    if (!this.controller) return;
    try {
      const data = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
      this.controller.enqueue(this.encoder.encode(data));
    } catch {
      this.controller = null;
    }
  }

  emit(event: { type: string; data: unknown }): void {
    if (!this.controller) return;
    try {
      const data = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
      this.controller.enqueue(this.encoder.encode(data));
    } catch {
      this.controller = null;
    }
  }

  emitPhase(phase: string, iteration: number): void {
    this.send({ type: "phase", data: { phase, iteration }, timestamp: Date.now() });
  }

  emitThought(content: string): void {
    this.send({ type: "thought", data: { content }, timestamp: Date.now() });
  }

  emitToolCall(tool: string, params: unknown): void {
    this.send({ type: "tool_call", data: { tool, params }, timestamp: Date.now() });
  }

  emitToolResult(tool: string, result: unknown): void {
    this.send({ type: "tool_result", data: { tool, result }, timestamp: Date.now() });
  }

  emitMemoryUpdate(memories: unknown): void {
    this.send({ type: "memory", data: { memories }, timestamp: Date.now() });
  }

  emitError(error: string): void {
    this.send({ type: "error", data: { error }, timestamp: Date.now() });
  }

  emitComplete(summary: string): void {
    this.send({ type: "complete", data: { summary }, timestamp: Date.now() });
  }

  phase(phase: string, iteration: number): void {
    this.send({ type: "phase", data: { phase, iteration }, timestamp: Date.now() });
  }

  thought(content: string): void {
    this.send({ type: "thought", data: { content }, timestamp: Date.now() });
  }

  toolCall(tool: string, params: unknown): void {
    this.send({ type: "tool_call", data: { tool, params }, timestamp: Date.now() });
  }

  toolResult(tool: string, result: unknown): void {
    this.send({ type: "tool_result", data: { tool, result }, timestamp: Date.now() });
  }

  memoryUpdate(memories: unknown): void {
    this.send({ type: "memory", data: { memories }, timestamp: Date.now() });
  }

  error(error: string): void {
    this.send({ type: "error", data: { error }, timestamp: Date.now() });
  }

  complete(summary: string): void {
    this.send({ type: "complete", data: { summary }, timestamp: Date.now() });
  }
}
