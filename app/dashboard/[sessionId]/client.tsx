"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Bot, Layers, Cpu, Database, Clock, Target, Edit3, Trash2, Save, X, RotateCcw, CheckCircle2, Stamp as StampIcon } from "lucide-react";
import type { AgentMission, AgentMemory, AgentIteration } from "@/lib/db/schema";
import * as crud from "@/lib/actions/crud";

interface Props {
  sessionId: string;
  mission: AgentMission;
  memories: AgentMemory[];
  iterations: AgentIteration[];
  totalMemories: number;
}

export function DashboardClient({ sessionId, mission, memories, iterations, totalMemories }: Props) {
  const router = useRouter();
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(mission.goal);

  const toolsUsed = iterations.filter((i) => i.toolUsed).map((i) => i.toolUsed!);
  const uniqueTools = [...new Set(toolsUsed)];

  const statusColor = mission.status === "complete" ? "text-[#3FA78E]" : mission.status === "failed" ? "text-[#C2703D]" : "text-[#C9A227]";

  async function handleRenameMission() {
    if (!goalInput.trim()) return;
    const r = await crud.updateMission(mission.id, { goal: goalInput.trim() });
    if (r.success) { setEditingGoal(false); router.refresh(); }
    else alert(r.error);
  }

  async function handleDeleteMission() {
    if (!confirm("Delete this mission and all associated data?")) return;
    await crud.deleteMission(mission.id);
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-[#0B0E13] text-[#F3EEE1] py-8 px-4">
      <div className="pointer-events-none fixed -top-40 right-0 z-0 h-[560px] w-[560px] rounded-full bg-[#C9A227]/[0.06] blur-[140px]" />
      <div className="pointer-events-none fixed -bottom-40 left-0 z-0 h-[400px] w-[400px] rounded-full bg-[#3FA78E]/[0.04] blur-[120px]" />

      <div className="mx-auto max-w-6xl relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/agent/${sessionId}?goal=${encodeURIComponent(mission.goal)}`} className="text-[#F3EEE1]/30 hover:text-[#F3EEE1]/60 transition-colors">
            <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {editingGoal ? (
                <div className="flex items-center gap-2">
                  <input value={goalInput} onChange={e => setGoalInput(e.target.value)}
                    className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] p-1.5 text-lg font-medium w-full max-w-md text-[#F3EEE1] focus:outline-none focus:border-[#C9A227]" style={{ fontFamily: "var(--font-display)" }} />
                  <button onClick={handleRenameMission} className="p-1.5 rounded-sm hover:bg-[#C9A227]/10 text-[#C9A227]"><Save className="h-4 w-4" strokeWidth={1.75} /></button>
                  <button onClick={() => { setEditingGoal(false); setGoalInput(mission.goal); }} className="p-1.5 rounded-sm hover:bg-[#F3EEE1]/[0.03] text-[#F3EEE1]/40"><X className="h-4 w-4" strokeWidth={1.75} /></button>
                </div>
              ) : (
                <>
                  <h1 className="text-xl font-medium tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Mission Dashboard</h1>
                  <button onClick={() => setEditingGoal(true)} className="p-1 rounded-sm hover:bg-[#F3EEE1]/[0.03] text-[#F3EEE1]/30 hover:text-[#F3EEE1]/60">
                    <Edit3 className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                </>
              )}
            </div>
            <p className="text-sm text-[#F3EEE1]/40 line-clamp-1">{mission.goal}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/agent/${sessionId}?goal=${encodeURIComponent(mission.goal)}`}
              className="inline-flex items-center gap-1.5 rounded-sm bg-[#C9A227]/10 px-3 py-1.5 text-sm font-medium text-[#C9A227] hover:bg-[#C9A227]/20 transition-all">
              <RotateCcw className="h-3 w-3" strokeWidth={1.75} /> Re-run
            </Link>
            <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${statusColor}`}>
              <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} />
              {mission.status}
            </span>
            <button onClick={handleDeleteMission}
              className="p-1.5 rounded-sm hover:bg-[#C2703D]/10 text-[#F3EEE1]/30 hover:text-[#C2703D] transition-all">
              <Trash2 className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-[#C9A227]/30 bg-[#C9A227]/10">
                <Layers className="h-5 w-5 text-[#C9A227]" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-[#C9A227]">{iterations.length}</p>
                <p className="text-sm font-mono text-[#F3EEE1]/40">ITERATIONS</p>
              </div>
            </div>
          </div>
          <div className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-[#C9A227]/30 bg-[#C9A227]/10">
                <Cpu className="h-5 w-5 text-[#C9A227]" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-[#C9A227]">{uniqueTools.length}</p>
                <p className="text-sm font-mono text-[#F3EEE1]/40">TOOLS USED</p>
              </div>
            </div>
          </div>
          <div className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-[#3FA78E]/30 bg-[#3FA78E]/10">
                <Database className="h-5 w-5 text-[#3FA78E]" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-[#3FA78E]">{totalMemories}</p>
                <p className="text-sm font-mono text-[#F3EEE1]/40">MEMORIES</p>
              </div>
            </div>
          </div>
          <div className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-[#C2703D]/30 bg-[#C2703D]/10">
                <Clock className="h-5 w-5 text-[#C2703D]" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-[#C2703D] capitalize">{mission.status}</p>
                <p className="text-sm font-mono text-[#F3EEE1]/40">STATUS</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Iterations + Memory */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] p-5">
            <h2 className="text-sm font-semibold text-[#F3EEE1] mb-4 font-mono tracking-wider uppercase">Iteration Timeline</h2>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {iterations.slice(0, 20).map((it) => (
                <div key={it.id} className="flex items-center gap-3 rounded-sm border border-[#F3EEE1]/[0.06] bg-[#F3EEE1]/[0.02] p-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-[#C9A227]/10 text-sm font-mono font-bold text-[#C9A227]">{it.iterationNumber}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium capitalize truncate text-[#F3EEE1]/80">{it.phase.replace(/_/g, " ")}</p>
                    {it.toolUsed && <p className="text-sm text-[#F3EEE1]/40 truncate">Tool: {it.toolUsed}</p>}
                    {it.reasoning && <p className="text-sm text-[#F3EEE1]/30 line-clamp-1 mt-0.5">{it.reasoning}</p>}
                  </div>
                  <span className="text-sm text-[#F3EEE1]/30 shrink-0 font-mono">
                    {it.timestamp ? new Date(it.timestamp).toLocaleTimeString() : ""}
                  </span>
                </div>
              ))}
              {iterations.length === 0 && <p className="text-sm text-[#F3EEE1]/30">No iterations recorded.</p>}
            </div>
          </div>

          <div className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] p-5">
            <h2 className="text-sm font-semibold text-[#F3EEE1] mb-4 font-mono tracking-wider uppercase">Agent Memory</h2>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {memories.map((mem) => (
                <div key={mem.id} className="rounded-sm border border-[#F3EEE1]/[0.06] bg-[#F3EEE1]/[0.02] p-3">
                  <div className="flex items-center gap-2">
                    <Database className="h-3.5 w-3.5 text-[#3FA78E]/50 shrink-0" strokeWidth={1.75} />
                    <span className="text-sm font-medium truncate text-[#F3EEE1]/80">{mem.key}</span>
                    <span className="ml-auto text-sm text-[#F3EEE1]/30 shrink-0 font-mono">{Math.round(mem.importance * 100)}%</span>
                  </div>
                  <p className="mt-1 text-sm text-[#F3EEE1]/50 line-clamp-2">{mem.value}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-sm text-[#F3EEE1]/30 capitalize">{mem.memoryType}</span>
                    {mem.createdAt && <span className="text-sm text-[#F3EEE1]/30">{new Date(mem.createdAt).toLocaleDateString()}</span>}
                  </div>
                </div>
              ))}
              {memories.length === 0 && <p className="text-sm text-[#F3EEE1]/30">No memories stored.</p>}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex gap-3 justify-center flex-wrap">
          <Link href={`/workspace/${sessionId}`}
            className="inline-flex items-center gap-2 rounded-sm bg-[#C9A227] px-6 py-3 text-sm font-semibold text-[#0B0E13] transition-all hover:-translate-y-0.5">
            <Target className="h-4 w-4" strokeWidth={1.75} /> Opportunity Workspace
          </Link>
          <Link href={`/memory/${sessionId}`}
            className="inline-flex items-center gap-2 rounded-sm border border-[#F3EEE1]/10 px-6 py-3 text-sm font-medium text-[#F3EEE1]/60 hover:bg-[#F3EEE1]/[0.03] transition-all">
            <Database className="h-4 w-4" strokeWidth={1.75} /> Full Memory
          </Link>
          <Link href="/mission"
            className="inline-flex items-center gap-2 rounded-sm border border-[#C9A227]/30 px-6 py-3 text-sm font-medium text-[#C9A227]/70 hover:bg-[#C9A227]/10 transition-all">
            + New Mission
          </Link>
        </div>
      </div>
    </main>
  );
}