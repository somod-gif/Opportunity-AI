import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateEmbedding, cosineSimilarity } from "@/lib/agent/memory/embedding";

void describe("Embedding", () => {
  void it("generates a deterministic embedding vector", async () => {
    const vec = await generateEmbedding("AI scholarships for African students");
    assert.ok(Array.isArray(vec));
    assert.equal(vec.length, 128);
    assert.ok(vec.every((v) => typeof v === "number"));
  });

  void it("generates similar embeddings for similar texts (fallback)", async () => {
    const a = await generateEmbedding("Python programming skills");
    const b = await generateEmbedding("Python coding experience");
    const sim = cosineSimilarity(a, b);
    assert.ok(sim > 0.8, `similarity ${sim} should be > 0.8`);
  });

  void it("generates different embeddings for different texts", async () => {
    const a = await generateEmbedding("AI scholarships in Canada");
    const b = await generateEmbedding("Cooking recipes for dinner");
    const sim = cosineSimilarity(a, b);
    assert.ok(sim < 0.6, `similarity ${sim} should be < 0.6`);
  });

  void it("handles empty string", async () => {
    const vec = await generateEmbedding("");
    assert.ok(Array.isArray(vec));
    assert.equal(vec.length, 128);
  });

  void it("cosineSimilarity returns 0 for mismatched lengths", () => {
    assert.equal(cosineSimilarity([1, 2, 3], [1, 2]), 0);
  });
});
