import type { MemoryType, MemoryEntry } from "@/lib/types";
import { db } from "@/lib/db";
import { agentMemories } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { generateEmbedding, cosineSimilarity } from "./embedding";

interface StoredMemory {
  key: string;
  value: string;
  type: MemoryType;
  importance: number;
  embedding?: number[];
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
}

export class AgentMemory {
  private storage = new Map<string, StoredMemory>();
  private maxMemories = 500;

  constructor(private sessionId: string, private missionId?: string) {}

  async store(
    key: string,
    value: string,
    type: MemoryType,
    importance = 0.5
  ): Promise<void> {
    const embedding = await generateEmbedding(`${key}: ${value}`);
    const mem: StoredMemory = {
      key,
      value,
      type,
      importance,
      embedding,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 0,
    };
    this.storage.set(key, mem);
    try {
      await db.insert(agentMemories).values({
        sessionId: this.sessionId,
        missionId: this.missionId,
        memoryType: type,
        key,
        value,
        importance,
        metadata: embedding ? { embedding } : undefined,
      });
    } catch {
      // DB write failed - continue with in-memory only
    }
    if (this.storage.size > this.maxMemories) {
      this.evict();
    }
  }

  async recall(key: string): Promise<StoredMemory | null> {
    const mem = this.storage.get(key);
    if (mem) {
      mem.lastAccessed = Date.now();
      mem.accessCount++;
      return mem;
    }
    return null;
  }

  async search(query: string, type?: MemoryType): Promise<StoredMemory[]> {
    const q = query.toLowerCase();
    const queryEmbedding = await generateEmbedding(query);

    const results = Array.from(this.storage.values()).filter((m) => {
      if (type && m.type !== type) return false;
      return m.key.toLowerCase().includes(q) || m.value.toLowerCase().includes(q);
    });

    // Re-rank by semantic similarity when embeddings exist
    if (queryEmbedding.length > 0) {
      for (const r of results) {
        if (r.embedding && r.embedding.length > 0) {
          const semanticScore = cosineSimilarity(queryEmbedding, r.embedding);
          r.importance = Math.min(1, r.importance * 0.5 + semanticScore * 0.5);
        }
      }
    }

    return results.sort((a, b) => b.importance - a.importance);
  }

  async recallRelevant(limit = 10): Promise<string> {
    const memories = Array.from(this.storage.values());
    if (memories.length < limit) {
      try {
        const dbMemories = await db
          .select()
          .from(agentMemories)
          .where(eq(agentMemories.sessionId, this.sessionId))
          .orderBy(desc(agentMemories.importance))
          .limit(limit);
        for (const m of dbMemories) {
          if (!this.storage.has(m.key)) {
            const emb = m.metadata && typeof m.metadata === "object" && "embedding" in m.metadata
              ? (m.metadata as { embedding: number[] }).embedding
              : undefined;
            this.storage.set(m.key, {
              key: m.key,
              value: m.value,
              type: m.memoryType as MemoryType,
              importance: m.importance,
              embedding: emb,
              createdAt: m.createdAt?.getTime() || Date.now(),
              lastAccessed: m.lastAccessed?.getTime() || Date.now(),
              accessCount: m.accessCount,
            });
          }
        }
      } catch {
        // DB read failed, use in-memory only
      }
    }
    const sorted = Array.from(this.storage.values())
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit);
    if (sorted.length === 0) return "No previous memories.";
    return sorted
      .map((m) => `[${m.type}] ${m.key}: ${m.value.slice(0, 200)}`)
      .join("\n");
  }

  async semanticSearch(query: string, limit = 5): Promise<StoredMemory[]> {
    const queryEmbedding = await generateEmbedding(query);
    if (queryEmbedding.length === 0) return [];

    const candidates = Array.from(this.storage.values());
    const scored = candidates
      .filter((m) => m.embedding && m.embedding.length > 0)
      .map((m) => ({
        memory: m,
        score: cosineSimilarity(queryEmbedding, m.embedding!),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Also try DB for more candidates
    if (scored.length < limit) {
      try {
        const dbMemories = await db
          .select()
          .from(agentMemories)
          .where(and(
            eq(agentMemories.sessionId, this.sessionId),
            sql`${agentMemories.metadata}->'embedding' IS NOT NULL`
          ))
          .orderBy(desc(agentMemories.importance))
          .limit(limit * 3);
        for (const m of dbMemories) {
          const emb = m.metadata && typeof m.metadata === "object" && "embedding" in m.metadata
            ? (m.metadata as { embedding: number[] }).embedding
            : undefined;
          if (emb && emb.length > 0) {
            const score = cosineSimilarity(queryEmbedding, emb);
            scored.push({
              memory: {
                key: m.key,
                value: m.value,
                type: m.memoryType as MemoryType,
                importance: m.importance,
                embedding: emb,
                createdAt: m.createdAt?.getTime() || Date.now(),
                lastAccessed: m.lastAccessed?.getTime() || Date.now(),
                accessCount: m.accessCount,
              },
              score,
            });
          }
        }
      } catch {
        // DB read failed
      }
    }

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.memory);
  }

  async getStats(): Promise<{
    total: number;
    byType: Record<MemoryType, number>;
    avgImportance: number;
    withEmbeddings: number;
  }> {
    const byType = { episodic: 0, semantic: 0, procedural: 0 };
    let totalImportance = 0;
    let withEmbeddings = 0;
    for (const m of this.storage.values()) {
      byType[m.type]++;
      totalImportance += m.importance;
      if (m.embedding) withEmbeddings++;
    }
    return {
      total: this.storage.size,
      byType,
      avgImportance: this.storage.size > 0 ? totalImportance / this.storage.size : 0,
      withEmbeddings,
    };
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }

  async toEntries(): Promise<MemoryEntry[]> {
    return Array.from(this.storage.values()).map((m) => ({
      id: `${this.sessionId}:${m.key}`,
      sessionId: this.sessionId,
      missionId: this.missionId,
      memoryType: m.type,
      key: m.key,
      value: m.value,
      importance: m.importance,
      accessCount: m.accessCount,
      createdAt: m.createdAt,
      lastAccessed: m.lastAccessed,
    }));
  }

  private evict(): void {
    const sorted = Array.from(this.storage.values()).sort((a, b) => {
      const scoreA = a.importance * (1 - 1 / (a.accessCount + 1));
      const scoreB = b.importance * (1 - 1 / (b.accessCount + 1));
      return scoreA - scoreB;
    });
    const toRemove = Math.floor(this.maxMemories * 0.2);
    for (let i = 0; i < toRemove && i < sorted.length; i++) {
      this.storage.delete(sorted[i]!.key);
    }
  }
}
