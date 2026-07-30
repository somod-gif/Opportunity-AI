import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SSEEmitter } from "@/lib/agent/emit";

void describe("SSEEmitter", () => {
  void it("handles connect/disconnect without errors", () => {
    const emitter = new SSEEmitter();
    const controller = {
      enqueue: () => {},
      close: () => {},
    } as unknown as ReadableStreamDefaultController;

    emitter.connect(controller);
    emitter.disconnect();
    assert.ok(true); // no crash
  });

  void it("emits phase events without crashing when connected", () => {
    const emitter = new SSEEmitter();
    const chunks: string[] = [];
    const controller = {
      enqueue: (chunk: Uint8Array) => { chunks.push(new TextDecoder().decode(chunk)); },
      close: () => {},
    } as unknown as ReadableStreamDefaultController;

    emitter.connect(controller);
    emitter.emitPhase("reason", 1);

    assert.equal(chunks.length, 1);
    assert.ok(chunks[0].includes("reason"));
    assert.ok(chunks[0].includes("1"));
  });

  void it("emits thought content events", () => {
    const emitter = new SSEEmitter();
    const chunks: string[] = [];
    const controller = {
      enqueue: (chunk: Uint8Array) => { chunks.push(new TextDecoder().decode(chunk)); },
      close: () => {},
    } as unknown as ReadableStreamDefaultController;

    emitter.connect(controller);
    emitter.emitThought("Analyzing mission...");

    assert.equal(chunks.length, 1);
    assert.ok(chunks[0].includes("Analyzing mission..."));
  });

  void it("emits tool call events with tool name and params", () => {
    const emitter = new SSEEmitter();
    const chunks: string[] = [];
    const controller = {
      enqueue: (chunk: Uint8Array) => { chunks.push(new TextDecoder().decode(chunk)); },
      close: () => {},
    } as unknown as ReadableStreamDefaultController;

    emitter.connect(controller);
    emitter.emitToolCall("search_opportunities", { types: ["scholarship"], limit: 10 });

    assert.equal(chunks.length, 1);
    assert.ok(chunks[0].includes("search_opportunities"));
    assert.ok(chunks[0].includes("scholarship"));
  });

  void it("emits complete event without crashing", () => {
    const emitter = new SSEEmitter();
    const chunks: string[] = [];
    const controller = {
      enqueue: (chunk: Uint8Array) => { chunks.push(new TextDecoder().decode(chunk)); },
      close: () => {},
    } as unknown as ReadableStreamDefaultController;

    emitter.connect(controller);
    emitter.emitComplete("Mission complete!");
    assert.equal(chunks.length, 1);
  });
});
