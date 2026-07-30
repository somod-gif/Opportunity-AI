import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { AgentMemory } from "@/lib/agent/memory/AgentMemory";

void describe("AgentMemory", () => {
  let memory: AgentMemory;

  before(() => {
    memory = new AgentMemory("test-session", "test-mission");
  });

  void it("stores and recalls a memory entry", async () => {
    await memory.store("search:ai-scholarships", "Found 5 AI scholarships", "episodic", 0.8);
    const result = await memory.recall("search:ai-scholarships");
    assert.notEqual(result, null);
    assert.equal(result!.key, "search:ai-scholarships");
    assert.equal(result!.type, "episodic");
    assert.equal(result!.importance, 0.8);
  });

  void it("returns relevant memories as formatted string", async () => {
    const relevant = await memory.recallRelevant(5);
    assert.ok(relevant.includes("search:ai-scholarships"));
    assert.ok(relevant.includes("Found 5 AI scholarships"));
  });

  void it("searches memories by keyword", async () => {
    await memory.store("gap:python-skills", "User needs Python proficiency", "semantic", 0.6);
    const results = await memory.search("python");
    assert.equal(results.length, 1);
    assert.equal(results[0].key, "gap:python-skills");
  });

  void it("returns empty recall when no memories", async () => {
    const fresh = new AgentMemory("empty-session");
    const result = await fresh.recallRelevant(5);
    assert.equal(result, "No previous memories.");
  });

  void it("returns memory stats", async () => {
    const stats = await memory.getStats();
    assert.equal(stats.total >= 2, true);
    assert.ok(stats.byType.episodic >= 1);
    assert.ok(stats.byType.semantic >= 1);
    assert.ok(stats.avgImportance > 0);
  });
});
