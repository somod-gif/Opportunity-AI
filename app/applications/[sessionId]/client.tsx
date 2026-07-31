"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bell, Clock, ExternalLink, Trash2, GripVertical } from "lucide-react";
import type { Opportunity, Application } from "@/lib/db/schema";
import * as crud from "@/lib/actions/crud";

interface Props {
  sessionId: string;
  applications: Application[];
  opportunities: Opportunity[];
  missionGoal: string;
}

const COLUMNS = [
  { id: "saved", label: "Draft", color: "[#F3EEE1]/30" },
  { id: "drafting", label: "Preparing", color: "blue" },
  { id: "submitted", label: "Applied", color: "yellow" },
  { id: "interview", label: "Interview", color: "purple" },
  { id: "accepted", label: "Offer", color: "green" },
  { id: "rejected", label: "Rejected", color: "red" },
] as const;

const COLUMN_COLORS: Record<string, { border: string; bg: string; dot: string; text: string }> = {
  saved: { border: "border-[#F3EEE1]/15", bg: "bg-[#F3EEE1]/[0.02]", dot: "bg-[#F3EEE1]/30", text: "text-[#F3EEE1]/30" },
  drafting: { border: "border-[#3FA78E]/20", bg: "bg-[#3FA78E]/[0.03]", dot: "bg-[#3FA78E]", text: "text-[#3FA78E]" },
  submitted: { border: "border-[#C9A227]/20", bg: "bg-[#C9A227]/[0.03]", dot: "bg-[#C9A227]", text: "text-[#C9A227]" },
  interview: { border: "border-purple-500/20", bg: "bg-purple-500/[0.03]", dot: "bg-purple-500", text: "text-purple-400" },
  accepted: { border: "border-[#3FA78E]/30", bg: "bg-[#3FA78E]/[0.05]", dot: "bg-[#3FA78E]", text: "text-[#3FA78E]" },
  rejected: { border: "border-[#C2703D]/30", bg: "bg-[#C2703D]/[0.05]", dot: "bg-[#C2703D]", text: "text-[#C2703D]" },
};

export function KanbanClient({ sessionId, applications: initialApps, opportunities: opps, missionGoal }: Props) {
  const router = useRouter();
  const [apps, setApps] = useState(initialApps);
  const [dragCol, setDragCol] = useState<string | null>(null);

  const getOpp = useCallback((app: Application) => opps.find(o => o.id === app.opportunityId), [opps]);

  async function handleDrop(appId: string, newStatus: string) {
    const app = apps.find(a => a.id === appId);
    if (!app || app.status === newStatus) return;
    setApps(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus as Application["status"] } : a));
    await crud.updateApplication(appId, { status: newStatus });
    router.refresh();
  }

  async function handleDelete(appId: string) {
    if (!confirm("Remove this application?")) return;
    await crud.deleteApplication(appId);
    setApps(prev => prev.filter(a => a.id !== appId));
    router.refresh();
  }

  async function handleReminder(app: Application, days: number) {
    const opp = getOpp(app);
    const deadline = app.deadline || opp?.deadline;
    if (!deadline) { alert("No deadline set for this opportunity."); return; }
    const due = new Date(new Date(deadline).getTime() - days * 86400000);
    const res = await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        opportunityId: app.opportunityId,
        type: "deadline",
        message: days === 0
          ? `"${opp?.title || "Opportunity"}" is due today. Submit your application.`
          : `"${opp?.title || "Opportunity"}" closes in ${days} day${days !== 1 ? "s" : ""}.`,
        dueAt: due.toISOString(),
        opportunityTitle: opp?.title,
      }),
    });
    const data = await res.json();
    if (data.success) {
      alert(days === 0 ? "Reminder set for today." : `Email reminder scheduled ${days} day${days !== 1 ? "s" : ""} before the deadline.`);
    } else {
      alert("Failed to set reminder.");
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0E13] text-[#F3EEE1]" style={{ fontFamily: "var(--font-body)" }}>
      <div className="pointer-events-none fixed -top-40 right-0 z-0 h-[560px] w-[560px] rounded-full bg-[#C9A227]/[0.06] blur-[140px]" />
      <div className="mx-auto max-w-7xl px-4 py-8 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href={`/dashboard/${sessionId}`} className="text-[#F3EEE1]/30 hover:text-[#F3EEE1]/60 transition-colors">
              <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
            </Link>
            <div>
              <h1 className="text-xl font-medium" style={{ fontFamily: "var(--font-display)" }}>Application Tracker</h1>
              <p className="text-sm text-[#F3EEE1]/40">{missionGoal} · {apps.length} application{apps.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <Link href={`/workspace/${sessionId}`}
            className="flex items-center gap-1.5 rounded-sm bg-[#C9A227] px-3.5 py-2 text-[14px] font-semibold text-[#0B0E13] hover:-translate-y-0.5 transition-all">
            <ExternalLink className="h-3.5 w-3.5" /> Browse Opportunities
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {COLUMNS.map((col) => {
            const colApps = apps.filter(a => a.status === col.id);
            const colors = COLUMN_COLORS[col.id];
            return (
              <div
                key={col.id}
                className={`rounded-sm border ${colors.border} ${colors.bg} ${dragCol === col.id ? "ring-1 ring-[#C9A227]/30" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragCol(col.id); }}
                onDragLeave={() => setDragCol(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  const appId = e.dataTransfer.getData("text/plain");
                  if (appId) handleDrop(appId, col.id);
                  setDragCol(null);
                }}
              >
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#F3EEE1]/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
                    <span className={`text-[14px] font-medium font-mono ${colors.text}`}>{col.label}</span>
                  </div>
                  <span className={`text-[13px] font-mono ${colors.text} opacity-50`}>{colApps.length}</span>
                </div>

                <div className="p-2 space-y-2 min-h-[120px]">
                  {colApps.map((app) => {
                    const opp = getOpp(app);
                    const deadline = app.deadline || opp?.deadline;
                    const daysLeft = deadline ? Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000) : null;
                    return (
                      <div
                        key={app.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", app.id);
                          e.currentTarget.classList.add("opacity-40");
                        }}
                        onDragEnd={(e) => {
                          e.currentTarget.classList.remove("opacity-40");
                        }}
                        className="rounded-sm border border-[#F3EEE1]/[0.06] bg-[#12161D]/80 px-3 py-2.5 cursor-grab active:cursor-grabbing hover:border-[#C9A227]/25 transition-all group"
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical className="h-3.5 w-3.5 text-[#F3EEE1]/20 mt-0.5 shrink-0" strokeWidth={1.5} />
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/opportunity/${sessionId}/${opp?.slug || ""}`}
                              className="text-[14px] font-medium text-[#F3EEE1]/80 hover:text-[#C9A227] transition-colors line-clamp-2 block"
                            >
                              {opp?.title || "Unknown opportunity"}
                            </Link>
                            <p className="text-[13px] text-[#F3EEE1]/30 mt-0.5">{opp?.provider || ""}</p>
                            {daysLeft !== null && (
                              <div className="flex items-center gap-1 mt-1.5">
                                <Clock className="h-3 w-3 text-[#C2703D]/50" strokeWidth={1.5} />
                                <span className={`text-[12px] font-mono ${daysLeft <= 7 ? "text-[#C2703D]" : "text-[#F3EEE1]/30"}`}>
                                  {daysLeft <= 0 ? "Due!" : `${daysLeft}d`}
                                </span>
                                <button
                                  onClick={() => handleReminder(app, 1)}
                                  title="Email reminder 1 day before deadline"
                                  className="ml-1 flex items-center gap-1 rounded-sm border border-[#C9A227]/20 px-1.5 py-0.5 text-[12px] text-[#C9A227] hover:bg-[#C9A227]/10 transition-colors"
                                >
                                  <Bell className="h-2.5 w-2.5" strokeWidth={1.75} /> Remind
                                </button>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleDelete(app.id)}
                            className="p-1 rounded-sm opacity-0 group-hover:opacity-100 hover:bg-[#C2703D]/10 text-[#F3EEE1]/30 hover:text-[#C2703D] transition-all shrink-0"
                          >
                            <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {colApps.length === 0 && (
                    <p className="text-[13px] text-[#F3EEE1]/20 text-center py-4 font-mono">Drop here</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
