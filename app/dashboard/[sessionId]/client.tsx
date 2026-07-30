"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bot, Layers, Cpu, Database, Clock, Target, Edit3, Trash2, Save, X, RotateCcw, CheckCircle2 } from "lucide-react";
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
  const statusColor = mission.status === "complete" ? "text-emerald-500" : mission.status === "failed" ? "text-destructive" : "text-amber-500";

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
    <main className="min-h-screen py-8 px-4">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/agent/${sessionId}?goal=${encodeURIComponent(mission.goal)}`} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {editingGoal ? (
                <div className="flex items-center gap-2">
                  <input value={goalInput} onChange={e => setGoalInput(e.target.value)}
                    className="rounded-lg border border-border bg-muted/50 p-1.5 text-lg font-bold w-full max-w-md" />
                  <button onClick={handleRenameMission} className="p-1.5 rounded hover:bg-primary/10 text-primary"><Save className="h-4 w-4" /></button>
                  <button onClick={() => { setEditingGoal(false); setGoalInput(mission.goal); }} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold tracking-tight">Mission Dashboard</h1>
                  <button onClick={() => setEditingGoal(true)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground/70 line-clamp-1">{mission.goal}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/agent/${sessionId}?goal=${encodeURIComponent(mission.goal)}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-all">
              <RotateCcw className="h-3 w-3" /> Re-run
            </Link>
            <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${statusColor}`}>
              <CheckCircle2 className="h-4 w-4" />
              {mission.status}
            </span>
            <button onClick={handleDeleteMission}
              className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Layers className="h-5 w-5 text-primary" /></div>
              <div><p className="text-2xl font-bold">{iterations.length}</p><p className="text-xs text-muted-foreground/70">Iterations</p></div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10"><Cpu className="h-5 w-5 text-amber-500" /></div>
              <div><p className="text-2xl font-bold">{uniqueTools.length}</p><p className="text-xs text-muted-foreground/70">Tools Used</p></div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10"><Database className="h-5 w-5 text-blue-500" /></div>
              <div><p className="text-2xl font-bold">{totalMemories}</p><p className="text-xs text-muted-foreground/70">Memories</p></div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted"><Clock className="h-5 w-5 text-muted-foreground" /></div>
              <div><p className="text-2xl font-bold capitalize">{mission.status}</p><p className="text-xs text-muted-foreground/70">Status</p></div>
            </div>
          </div>
        </div>

        {/* Bottom: Iterations + Memory */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold mb-4">Iteration Timeline</h2>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {iterations.slice(0, 20).map((it) => (
                <div key={it.id} className="flex items-center gap-3 rounded-lg bg-muted/30 border border-border/50 p-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/10 text-xs font-mono font-bold text-primary">{it.iterationNumber}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium capitalize truncate">{it.phase.replace(/_/g, " ")}</p>
                    {it.toolUsed && <p className="text-xs text-muted-foreground/60 truncate">Tool: {it.toolUsed}</p>}
                    {it.reasoning && <p className="text-xs text-muted-foreground/40 line-clamp-1 mt-0.5">{it.reasoning}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground/40 shrink-0">
                    {it.timestamp ? new Date(it.timestamp).toLocaleTimeString() : ""}
                  </span>
                </div>
              ))}
              {iterations.length === 0 && <p className="text-sm text-muted-foreground/50">No iterations recorded.</p>}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold mb-4">Agent Memory</h2>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {memories.map((mem) => (
                <div key={mem.id} className="rounded-lg bg-muted/30 border border-border/50 p-3">
                  <div className="flex items-center gap-2">
                    <Database className="h-3.5 w-3.5 text-blue-500/50 shrink-0" />
                    <span className="text-sm font-medium truncate">{mem.key}</span>
                    <span className="ml-auto text-xs text-muted-foreground/40 shrink-0 font-mono">{Math.round(mem.importance * 100)}%</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground/60 line-clamp-2">{mem.value}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-muted-foreground/30 capitalize">{mem.memoryType}</span>
                    {mem.createdAt && <span className="text-xs text-muted-foreground/30">{new Date(mem.createdAt).toLocaleDateString()}</span>}
                  </div>
                </div>
              ))}
              {memories.length === 0 && <p className="text-sm text-muted-foreground/50">No memories stored.</p>}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex gap-3 justify-center">
          <Link href={`/workspace/${sessionId}`}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.97]">
            <Target className="h-4 w-4" /> Opportunity Workspace
          </Link>
          <Link href={`/memory/${sessionId}`}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-medium hover:bg-muted/60 active:scale-[0.97]">
            <Database className="h-4 w-4" /> Full Memory
          </Link>
        </div>
      </div>
    </main>
  );
}
