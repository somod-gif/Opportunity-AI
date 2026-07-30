"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Database, Brain, BookOpen, Cpu, Clock, Hash, Edit3, Trash2, Save, X } from "lucide-react";
import type { AgentMemory } from "@/lib/db/schema";
import * as crud from "@/lib/actions/crud";

interface Props {
  sessionId: string;
  memories: AgentMemory[];
  missionGoal?: string;
}

const typeIcons: Record<string, typeof Database> = { episodic: Clock, semantic: BookOpen, procedural: Cpu };
const typeColors: Record<string, string> = {
  episodic: "text-amber-500 bg-amber-500/10",
  semantic: "text-blue-500 bg-blue-500/10",
  procedural: "text-violet-500 bg-violet-500/10",
};

export function MemoryClient({ sessionId, memories: initialMemories, missionGoal }: Props) {
  const router = useRouter();
  const [memories, setMemories] = useState(initialMemories);
  const [editing, setEditing] = useState<AgentMemory | null>(null);
  const [form, setForm] = useState({ key: "", value: "", importance: 0.5 });

  async function handleUpdate() {
    if (!editing) return;
    const r = await crud.updateMemory(editing.id, form);
    if (r.success) {
      setMemories(prev => prev.map(m => m.id === editing.id ? { ...m, ...form } : m));
      setEditing(null);
      router.refresh();
    } else alert(r.error);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this memory?")) return;
    await crud.deleteMemory(id);
    setMemories(prev => prev.filter(m => m.id !== id));
    router.refresh();
  }

  function openEdit(mem: AgentMemory) {
    setEditing(mem);
    setForm({ key: mem.key, value: mem.value, importance: mem.importance });
  }

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/dashboard/${sessionId}`} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Agent Memory</h1>
            <p className="text-sm text-muted-foreground">
              {memories.length} memories stored
              {missionGoal ? ` for "${missionGoal.slice(0, 60)}${missionGoal.length > 60 ? "..." : ""}"` : ""}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {memories.map((mem) => {
            const Icon = typeIcons[mem.memoryType] || Database;
            const color = typeColors[mem.memoryType] || "text-muted-foreground bg-muted";
            return (
              <div key={mem.id} className="rounded-xl border border-border bg-card p-5 group">
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color.split(" ")[1]}`}>
                    <Icon className={`h-5 w-5 ${color.split(" ")[0]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
                        {mem.memoryType}
                      </span>
                      <span className="text-sm text-muted-foreground truncate">{mem.key}</span>
                      <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                        <Hash className="h-3 w-3" />
                        {Math.round(mem.importance * 100)}%
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(mem)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(mem.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">{mem.value}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      {mem.createdAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(mem.createdAt).toLocaleString()}
                        </span>
                      )}
                      {mem.accessCount > 0 && <span>Accessed {mem.accessCount} times</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {memories.length === 0 && (
            <div className="text-center py-16">
              <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No memories yet</h2>
              <p className="text-muted-foreground mb-6">Run an agent session to build up memory.</p>
              <Link href="/mission" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
                Start a Mission
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* EDIT MODAL */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Memory</h3>
              <button onClick={() => setEditing(null)} className="p-1 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <input value={form.key} onChange={e => setForm({ ...form, key: e.target.value })} placeholder="Key" className="w-full rounded-lg border border-border bg-muted/50 p-2.5 text-sm" />
              <textarea value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} placeholder="Value" rows={4} className="w-full rounded-lg border border-border bg-muted/50 p-2.5 text-sm resize-none" />
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Importance: {Math.round(form.importance * 100)}%</label>
                <input type="range" min="0" max="1" step="0.05" value={form.importance} onChange={e => setForm({ ...form, importance: parseFloat(e.target.value) })} className="w-full" />
              </div>
              <button onClick={handleUpdate}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                <Save className="h-4 w-4" /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
