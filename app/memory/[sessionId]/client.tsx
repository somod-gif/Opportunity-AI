"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Database, Brain, BookOpen, Cpu, Clock, Hash, Edit3, Trash2, Save, X, Stamp as StampIcon } from "lucide-react";
import type { AgentMemory } from "@/lib/db/schema";
import * as crud from "@/lib/actions/crud";

interface Props {
  sessionId: string;
  memories: AgentMemory[];
  missionGoal?: string;
}

const typeIcons: Record<string, typeof Database> = { episodic: Clock, semantic: BookOpen, procedural: Cpu };
const typeColors: Record<string, string> = {
  episodic: "text-[#C9A227] bg-[#C9A227]/10",
  semantic: "text-[#3FA78E] bg-[#3FA78E]/10",
  procedural: "text-[#C2703D] bg-[#C2703D]/10",
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
    <main className="min-h-screen bg-[#0B0E13] text-[#F3EEE1] py-8 px-4">
      <div className="pointer-events-none fixed -top-40 right-0 z-0 h-[560px] w-[560px] rounded-full bg-[#C9A227]/[0.06] blur-[140px]" />
      <div className="pointer-events-none fixed -bottom-40 left-0 z-0 h-[400px] w-[400px] rounded-full bg-[#3FA78E]/[0.04] blur-[120px]" />

      <div className="mx-auto max-w-4xl relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/dashboard/${sessionId}`} className="text-[#F3EEE1]/30 hover:text-[#F3EEE1]/60 transition-colors">
            <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
          </Link>
          <div>
            <h1 className="text-xl font-medium" style={{ fontFamily: "var(--font-display)" }}>Agent Memory</h1>
            <p className="text-sm text-[#F3EEE1]/40">
              {memories.length} memories stored
              {missionGoal ? ` for "${missionGoal.slice(0, 60)}${missionGoal.length > 60 ? "..." : ""}"` : ""}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {memories.map((mem) => {
            const Icon = typeIcons[mem.memoryType] || Database;
            const color = typeColors[mem.memoryType] || "text-[#F3EEE1]/40 bg-[#F3EEE1]/[0.03]";
            return (
              <div key={mem.id} className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] p-5 group">
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border ${color.split(" ")[1]}`}>
                    <Icon className={`h-5 w-5 ${color.split(" ")[0]}`} strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[12px] font-medium font-mono ${color}`}>
                        {mem.memoryType}
                      </span>
                      <span className="text-sm text-[#F3EEE1]/60 truncate">{mem.key}</span>
                      <span className="ml-auto flex items-center gap-1 text-sm text-[#F3EEE1]/40 font-mono">
                        <Hash className="h-3 w-3" strokeWidth={1.75} />
                        {Math.round(mem.importance * 100)}%
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(mem)} className="p-1 rounded-sm hover:bg-[#F3EEE1]/[0.03] text-[#F3EEE1]/30 hover:text-[#F3EEE1]/60">
                          <Edit3 className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </button>
                        <button onClick={() => handleDelete(mem.id)} className="p-1 rounded-sm hover:bg-[#C2703D]/10 text-[#F3EEE1]/30 hover:text-[#C2703D]">
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-[#F3EEE1]/70 leading-relaxed">{mem.value}</p>
                    <div className="mt-2 flex items-center gap-3 text-sm text-[#F3EEE1]/30">
                      {mem.createdAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" strokeWidth={1.75} />
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
              <Database className="mx-auto h-12 w-12 text-[#F3EEE1]/20 mb-4" strokeWidth={1.5} />
              <h2 className="text-lg font-medium text-[#F3EEE1] mb-2" style={{ fontFamily: "var(--font-display)" }}>No memories yet</h2>
              <p className="text-sm text-[#F3EEE1]/40 mb-6">Run an agent session to build up memory.</p>
              <Link href="/mission" className="inline-flex items-center gap-2 rounded-sm bg-[#C9A227] px-6 py-3 text-sm font-semibold text-[#0B0E13] transition-all hover:-translate-y-0.5">
                Start a Mission
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* EDIT MODAL */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0E13]/80 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div className="w-full max-w-lg rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-[#F3EEE1]" style={{ fontFamily: "var(--font-display)" }}>Edit Memory</h3>
              <button onClick={() => setEditing(null)} className="p-1 rounded-sm hover:bg-[#F3EEE1]/[0.03] text-[#F3EEE1]/30"><X className="h-4 w-4" strokeWidth={1.75} /></button>
            </div>
            <div className="space-y-3">
              <input value={form.key} onChange={e => setForm({ ...form, key: e.target.value })} placeholder="Key" className="w-full border-0 border-b-[1.5px] border-[#F3EEE1]/15 bg-transparent py-2 text-sm text-[#F3EEE1] placeholder:text-[#F3EEE1]/20 focus:border-[#C9A227] focus:outline-none transition-colors" />
              <textarea value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} placeholder="Value" rows={4} className="w-full border-0 border-b-[1.5px] border-[#F3EEE1]/15 bg-transparent py-2 text-sm text-[#F3EEE1] placeholder:text-[#F3EEE1]/20 focus:border-[#C9A227] focus:outline-none transition-colors resize-none" />
              <div>
                <label className="text-sm text-[#F3EEE1]/40 mb-1 block font-mono">Importance: {Math.round(form.importance * 100)}%</label>
                <input type="range" min="0" max="1" step="0.05" value={form.importance} onChange={e => setForm({ ...form, importance: parseFloat(e.target.value) })} className="w-full accent-[#C9A227]" />
              </div>
              <button onClick={handleUpdate}
                className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-[#C9A227] px-4 py-2.5 text-sm font-semibold text-[#0B0E13] transition-all hover:-translate-y-0.5">
                <Save className="h-4 w-4" strokeWidth={2} /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}