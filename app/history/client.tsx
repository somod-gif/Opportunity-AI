"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bot, ChevronRight, Clock, CheckCircle2, XCircle, Loader2, RefreshCw, ArrowRight, Sparkles } from "lucide-react";
import { GrainOverlay } from "@/components/shared/GrainOverlay";

interface Mission {
  id: string;
  sessionId: string;
  goal: string;
  status: "running" | "complete" | "failed" | "idle";
  currentIteration: number;
  createdAt: string;
  updatedAt: string;
}

function Stamp({ label, tone = "brass" }: { label: string; tone?: "brass" | "signal" | "muted" }) {
  const c = tone === "signal" ? "border-[#3FA78E] text-[#3FA78E]" : tone === "muted" ? "border-[#F3EEE1]/20 text-[#F3EEE1]/30" : "border-[#C9A227] text-[#C9A227]";
  return <span className={`inline-block border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${c}`}>{label}</span>;
}

export function HistoryClient() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  async function fetchMissions() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/missions");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setMissions(data);
    } catch {
      setError("Could not load mission history.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchMissions(); }, []);

  const statusIcon = (s: string) => {
    switch (s) {
      case "complete": return <CheckCircle2 className="h-3.5 w-3.5 text-[#3FA78E]" />;
      case "running": return <Loader2 className="h-3.5 w-3.5 text-[#C9A227] animate-spin" />;
      case "failed": return <XCircle className="h-3.5 w-3.5 text-red-400" />;
      default: return <Clock className="h-3.5 w-3.5 text-[#F3EEE1]/30" />;
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0B0E13] text-[#F3EEE1] antialiased" style={{ fontFamily: "var(--font-body)" }}>
      <GrainOverlay />
      <div className="pointer-events-none fixed -top-40 right-0 z-0 h-[560px] w-[560px] rounded-full bg-[#C9A227]/[0.06] blur-[140px]" />
      <div className="pointer-events-none fixed -bottom-40 left-0 z-0 h-[400px] w-[400px] rounded-full bg-[#3FA78E]/[0.04] blur-[120px]" />

      <div className="fixed top-0 z-50 w-full border-b border-[#F3EEE1]/10 bg-[#0B0E13]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <a href="/" className="flex items-center gap-3 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm border-[1.5px] border-[#C9A227] text-[#C9A227] transition-transform group-hover:-rotate-6">
              <Bot className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <span className="font-medium tracking-tight text-[#F3EEE1]" style={{ fontFamily: "var(--font-display)" }}>History</span>
          </a>
          <div className="flex items-center gap-3">
            <button onClick={fetchMissions} className="flex items-center gap-1.5 rounded-sm border border-[#F3EEE1]/10 px-3 py-1.5 font-mono text-[11px] text-[#F3EEE1]/50 hover:text-[#F3EEE1] transition-colors">
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <a href="/mission" className="inline-flex items-center gap-2 rounded-sm bg-[#C9A227] px-4 py-2 text-[13px] font-semibold text-[#0B0E13] transition-transform hover:-translate-y-0.5">
              <Sparkles className="h-3.5 w-3.5" /> New Mission
            </a>
          </div>
        </div>
      </div>

      <main className="relative z-10 mx-auto max-w-4xl px-4 pt-28 pb-16 sm:px-6">
        <h1 className="text-2xl font-medium tracking-tight mb-2" style={{ fontFamily: "var(--font-display)" }}>Mission History</h1>
        <p className="text-sm text-[#F3EEE1]/40 mb-8">All your past and current autonomous agent missions</p>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-[#C9A227]" />
          </div>
        )}

        {error && (
          <div className="rounded-sm border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-400/80">{error}</div>
        )}

        {!loading && !error && missions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bot className="h-12 w-12 text-[#F3EEE1]/10 mb-4" />
            <p className="text-[#F3EEE1]/30 mb-6">No missions yet. Launch your first autonomous agent.</p>
            <a href="/mission" className="inline-flex items-center gap-2 rounded-sm bg-[#C9A227] px-5 py-2.5 text-[13px] font-semibold text-[#0B0E13] transition-transform hover:-translate-y-0.5">
              Start a Mission <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        )}

        {!loading && !error && missions.length > 0 && (
          <div className="space-y-2">
            {missions.map((m) => (
              <button
                key={m.id}
                onClick={() => router.push(`/dashboard/${m.sessionId}`)}
                className="w-full flex items-center gap-4 rounded-sm border border-[#F3EEE1]/10 bg-[#F3EEE1]/[0.02] px-5 py-4 text-left transition-all hover:border-[#F3EEE1]/20 hover:bg-[#F3EEE1]/[0.04] group"
              >
                <div className="shrink-0">{statusIcon(m.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-[#F3EEE1] truncate">{m.goal}</span>
                    <Stamp label={m.status} tone={m.status === "complete" ? "signal" : m.status === "running" ? "brass" : "muted"} />
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px] text-[#F3EEE1]/30">
                    <span>{new Date(m.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    <span>·</span>
                    <span>{m.currentIteration} iteration{m.currentIteration !== 1 ? "s" : ""}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#F3EEE1]/20 group-hover:text-[#F3EEE1]/50 transition-colors shrink-0" />
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
