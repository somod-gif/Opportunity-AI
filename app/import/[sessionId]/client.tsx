"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Loader2, CheckCircle2, XCircle, ArrowRight, AlertCircle, Sparkles, Clock,
  Brain, Target, Search, Database, FileText, Lightbulb, ChevronRight, Globe, Award,
  Zap, GraduationCap, Link2, ClipboardPaste, Calendar, MapPin, Building2, TrendingUp,
  ClipboardCheck, AlertTriangle, Cpu, ShieldCheck,
} from "lucide-react";
import { getDeviceId } from "@/lib/utils";
import type { ImportReport } from "@/lib/import/types";

const BRASS = "#C9A227";
const SIGNAL = "#3FA78E";
const OCHRE = "#C2703D";

interface PhaseEvent { phase: string; iteration: number }
interface ThoughtEvent { content: string }
interface ToolCallEvent { tool: string; params: unknown }
interface ToolResultEvent { tool: string; result: { summary?: string; success?: boolean; metadata?: Record<string, unknown> } }
interface MemoryUpdateEvent { memories: Array<{ key: string; type: string; importance: number }> }
interface CompleteEvent { summary: string; report?: ImportReport }

const STEP_LABELS: Record<string, string> = {
  perceive: "Perceiving the source",
  reason: "Reasoning with Gemma 4",
  plan: "Planning the strategy",
  tool_select: "Selecting tools",
  tool_execute: "Fetching the page",
  observe: "Observing results",
  memory: "Storing to memory",
  complete: "Analysis complete",
};

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function GrainOverlay() {
  return (
    <svg className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.025] mix-blend-overlay" aria-hidden="true">
      <filter id="grain-import-agent">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain-import-agent)" />
    </svg>
  );
}

export function ClientImportPage({ sessionId, url, text }: { sessionId: string; url: string; text: string }) {
  const router = useRouter();
  const [currentPhase, setCurrentPhase] = useState<PhaseEvent | null>(null);
  const [currentThought, setCurrentThought] = useState("");
  const [thoughts, setThoughts] = useState<string[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCallEvent[]>([]);
  const [toolResults, setToolResults] = useState<ToolResultEvent[]>([]);
  const [memories, setMemories] = useState<MemoryUpdateEvent[]>([]);
  const [completed, setCompleted] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [connecting, setConnecting] = useState(true);
  const [log, setLog] = useState<Array<{ time: string; msg: string; type: "info" | "tool" | "done" | "error" }>>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sourceRef = useRef<EventSource | null>(null);
  const startTimeRef = useRef(Date.now());
  const completedRef = useRef(false);

  const addLog = useCallback((msg: string, type: "info" | "tool" | "done" | "error" = "info") => {
    const t = new Date().toLocaleTimeString();
    setLog((prev) => [...prev.slice(-50), { time: t, msg, type }]);
  }, []);

  useEffect(() => {
    let cancelled = false;
    startTimeRef.current = Date.now();

    (async () => {
      try {
        const res = await fetch(`/api/import/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "complete" && data.report) {
            if (cancelled) return;
            completedRef.current = true;
            setCompleted(true);
            setReport(data.report);
            setConnecting(false);
            addLog("Loaded completed analysis from database", "done");
            return;
          }
        }
      } catch { /* fall through to streaming */ }

      if (cancelled) return;
      runStream();
    })();

    return () => {
      cancelled = true;
      if (typewriterRef.current) clearInterval(typewriterRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      sourceRef.current?.close();
    };
  }, [sessionId, url, text, addLog]);

  function runStream() {
    setConnecting(true);
    addLog("Initializing import analyzer...", "info");

    const params = new URLSearchParams({ deviceId: getDeviceId() });
    if (url) params.set("url", url);
    if (text) params.set("text", text);

    const source = new EventSource(`/api/import/${sessionId}/stream?${params.toString()}`);
    sourceRef.current = source;
    source.onopen = () => {
      setConnecting(false);
      addLog("Connected to Gemma 4 analysis engine", "done");
    };

    source.addEventListener("phase", (e: MessageEvent) => {
      const data: PhaseEvent = JSON.parse(e.data);
      setCurrentPhase(data);
      if (STEP_LABELS[data.phase]) addLog(STEP_LABELS[data.phase], "info");
      if (data.phase === "tool_execute") addLog("Executing tool...", "tool");
      if (data.phase === "memory") addLog("Storing to memory", "info");
    });

    source.addEventListener("thought", (e: MessageEvent) => {
      const data: ThoughtEvent = JSON.parse(e.data);
      setThoughts((prev) => [...prev, data.content]);
      if (typewriterRef.current) clearInterval(typewriterRef.current);
      setCurrentThought("");
      let i = 0;
      typewriterRef.current = setInterval(() => {
        if (i < data.content.length) {
          setCurrentThought(data.content.slice(0, i + 1));
          i++;
        } else if (typewriterRef.current) {
          clearInterval(typewriterRef.current);
        }
      }, 10);
    });

    source.addEventListener("tool_call", (e: MessageEvent) => {
      const data: ToolCallEvent = JSON.parse(e.data);
      setToolCalls((prev) => [...prev, data]);
      addLog(`→ ${data.tool}`, "tool");
    });

    source.addEventListener("tool_result", (e: MessageEvent) => {
      const data: ToolResultEvent = JSON.parse(e.data);
      setToolResults((prev) => [...prev, data]);
      addLog(data.result.summary || "Done", data.result.success !== false ? "done" : "error");
    });

    source.addEventListener("memory", (e: MessageEvent) => {
      const data: MemoryUpdateEvent = JSON.parse(e.data);
      setMemories((prev) => [...prev, data]);
    });

    source.addEventListener("complete", (e: MessageEvent) => {
      const data: CompleteEvent = JSON.parse(e.data);
      completedRef.current = true;
      setCompleted(true);
      addLog("Analysis complete", "done");
      if (data.report) setReport(data.report);
    });

    source.addEventListener("error", (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data);
        setError(parsed.error || parsed.message || e.data);
        addLog(parsed.error || "Error occurred", "error");
      } catch {
        setError(e.data);
        addLog(e.data, "error");
      }
    });

    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    timerRef.current = timer;
  }

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  const phase = currentPhase?.phase || "perceive";
  const lastToolCall = toolCalls[toolCalls.length - 1];
  const doneCount = toolResults.filter((r) => r.result.success !== false).length;
  const failedCount = toolResults.filter((r) => r.result.success === false).length;

  if (completed && report) {
    return <ResultsView sessionId={sessionId} report={report} elapsed={elapsed} />;
  }

  return (
    <div className="min-h-screen bg-[#0B0E13] text-[#F3EEE1]">
      <GrainOverlay />
      <div className="pointer-events-none fixed -top-40 right-0 z-0 h-[560px] w-[560px] rounded-full bg-[#C9A227]/[0.06] blur-[140px]" />
      <div className="pointer-events-none fixed -bottom-40 left-0 z-0 h-[400px] w-[400px] rounded-full bg-[#3FA78E]/[0.04] blur-[120px]" />

      <header className="fixed top-0 z-40 w-full border-b border-[#F3EEE1]/10 bg-[#0B0E13]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <button onClick={() => router.push("/import")} className="flex items-center gap-2 text-[13px] text-[#F3EEE1]/40 hover:text-[#F3EEE1] transition-colors">
            <ArrowRight className="h-4 w-4 -rotate-180" /> New analysis
          </button>
          <div className="flex items-center gap-2 font-mono text-sm text-[#F3EEE1]/40">
            <Cpu className="h-4 w-4 text-[#C9A227]" />
            Import analyzer
          </div>
          <span className="font-mono text-sm text-[#F3EEE1]/40">{formatTime(elapsed)}</span>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-4 pt-20 pb-16 sm:px-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm border-[1.5px] border-[#C9A227] text-[#C9A227]">
            <Bot className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-lg font-medium tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              Analyzing opportunity
            </h1>
            <p className="font-mono text-[13px] text-[#F3EEE1]/35 truncate max-w-md">
              {url || "Pasted listing text"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Left: stream */}
          <div className="lg:col-span-2 space-y-4">
            {/* Phase panel */}
            <div className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[13px] uppercase tracking-[0.15em] text-[#F3EEE1]/40">
                  {STEP_LABELS[phase] || phase}
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[13px] text-[#C9A227]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> running
                </span>
              </div>
              <div className="h-1 w-full bg-[#F3EEE1]/[0.06] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#C9A227] to-[#C2703D]"
                  initial={{ width: "5%" }}
                  animate={{ width: completed ? "100%" : connecting ? "10%" : "45%" }}
                  transition={{ duration: 0.8 }}
                />
              </div>
              <div className="mt-4 min-h-[64px]">
                {currentThought ? (
                  <p className="text-sm text-[#F3EEE1]/70 leading-relaxed">
                    <span className="text-[#C9A227] mr-1.5">◆</span>
                    {currentThought}
                    <span className="inline-block w-1.5 h-4 ml-0.5 bg-[#C9A227]/70 animate-pulse align-middle" />
                  </p>
                ) : (
                  <p className="text-sm text-[#F3EEE1]/25 italic">Awaiting Gemma 4 reasoning...</p>
                )}
              </div>
            </div>

            {/* Log */}
            <div className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] p-5">
              <p className="mb-3 font-mono text-[13px] uppercase tracking-[0.15em] text-[#F3EEE1]/40">
                Agent activity
              </p>
              <div className="space-y-2 font-mono text-[13px] max-h-[360px] overflow-y-auto pr-2">
                {log.map((entry, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-[#F3EEE1]/25 shrink-0">{entry.time}</span>
                    <span
                      className={
                        entry.type === "tool"
                          ? "text-[#C9A227]"
                          : entry.type === "done"
                          ? "text-[#3FA78E]"
                          : entry.type === "error"
                          ? "text-[#C2703D]"
                          : "text-[#F3EEE1]/50"
                      }
                    >
                      {entry.msg}
                    </span>
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          </div>

          {/* Right: stats */}
          <div className="space-y-4">
            <div className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] p-5">
              <p className="mb-4 font-mono text-[13px] uppercase tracking-[0.15em] text-[#F3EEE1]/40">
                Pipeline status
              </p>
              {[
                { label: "Scrape / read source", key: "perceive" },
                { label: "Structure extraction", key: "reason" },
                { label: "Eligibility scoring", key: "plan" },
                { label: "Skill gap roadmap", key: "reason2" },
                { label: "Similar opportunity research", key: "tool_execute" },
                { label: "Application strategy", key: "plan2" },
                { label: "Persist + memory", key: "memory" },
              ].map((step) => {
                const doneMap: Record<string, boolean> = {};
                if (doneCount >= 1) doneMap.perceive = true;
                if (doneCount >= 2) doneMap.reason = true;
                if (doneCount >= 3) doneMap.plan = true;
                if (doneCount >= 4) doneMap.reason2 = true;
                if (doneCount >= 5) doneMap.tool_execute = true;
                if (doneCount >= 6) doneMap.plan2 = true;
                if (doneCount >= 7) doneMap.memory = true;
                const isDone = doneMap[step.key];
                const isCurrent = !isDone && !completed;
                return (
                  <div key={step.label} className="flex items-center gap-3 py-1.5">
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 text-[#3FA78E] shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="h-4 w-4 text-[#C9A227] animate-spin shrink-0" />
                    ) : (
                      <Clock className="h-4 w-4 text-[#F3EEE1]/20 shrink-0" />
                    )}
                    <span className={`text-[13px] ${isDone ? "text-[#F3EEE1]/60" : isCurrent ? "text-[#F3EEE1]/85" : "text-[#F3EEE1]/25"}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] p-5">
              <p className="mb-3 font-mono text-[13px] uppercase tracking-[0.15em] text-[#F3EEE1]/40">
                Sessions
              </p>
              <p className="font-mono text-[13px] text-[#F3EEE1]/25 break-all">#{sessionId.slice(0, 16)}</p>
            </div>

            {error && (
              <div className="rounded-sm border border-[#C2703D]/30 bg-[#C2703D]/10 px-4 py-3 text-sm text-[#C2703D]">
                {error}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ─────────────────────────── Results view ─────────────────────────── */

function VerdictStamp({ verdict, fitScore }: { verdict: string; fitScore: number }) {
  const tone =
    verdict === "strong" ? SIGNAL : verdict === "possible" ? BRASS : "#C2703D";
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-dashed px-4 py-1.5 font-mono text-[13px] font-semibold uppercase tracking-[0.18em]"
      style={{ borderColor: `${tone}55`, color: tone, backgroundColor: `${tone}11` }}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ backgroundColor: tone }} />
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: tone }} />
      </span>
      {verdict} · {fitScore}/100
    </span>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Target; children: React.ReactNode }) {
  return (
    <section className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] p-6">
      <div className="flex items-center gap-3 mb-5">
        <Icon className="h-4 w-4 text-[#C9A227]" strokeWidth={1.75} />
        <h2 className="text-base font-medium tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function ResultsView({ sessionId, report, elapsed }: { sessionId: string; report: ImportReport; elapsed: number }) {
  const router = useRouter();
  const r = report;

  return (
    <div className="min-h-screen bg-[#0B0E13] text-[#F3EEE1]">
      <GrainOverlay />
      <div className="pointer-events-none fixed -top-40 right-0 z-0 h-[560px] w-[560px] rounded-full bg-[#C9A227]/[0.06] blur-[140px]" />
      <div className="pointer-events-none fixed -bottom-40 left-0 z-0 h-[400px] w-[400px] rounded-full bg-[#3FA78E]/[0.04] blur-[120px]" />

      <header className="fixed top-0 z-40 w-full border-b border-[#F3EEE1]/10 bg-[#0B0E13]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <button onClick={() => router.push("/import")} className="flex items-center gap-2 text-[13px] text-[#F3EEE1]/40 hover:text-[#F3EEE1] transition-colors">
            <ArrowRight className="h-4 w-4 -rotate-180" /> New analysis
          </button>
          <span className="font-mono text-[13px] text-[#F3EEE1]/40">
            analysis {formatTime(elapsed)}
          </span>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-4 pt-24 pb-16 sm:px-6">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <VerdictStamp verdict={r.verdict} fitScore={r.fitScore} />
            <span className="font-mono text-[13px] text-[#F3EEE1]/35">{r.extraction.type}</span>
            {r.sourceUrl && (
              <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-mono text-[13px] text-[#3FA78E] hover:text-[#3FA78E]/70 transition-colors">
                <Link2 className="h-3.5 w-3.5" /> source
              </a>
            )}
          </div>
          <h1 className="text-3xl font-medium tracking-tight leading-tight" style={{ fontFamily: "var(--font-display)" }}>
            {r.extraction.title}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-[#F3EEE1]/45">
            <span className="inline-flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> {r.extraction.provider}</span>
            {r.extraction.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {r.extraction.location}</span>}
            {r.extraction.deadlineText && (
              <span className="inline-flex items-center gap-1.5 text-[#C2703D]"><Calendar className="h-3.5 w-3.5" /> Deadline: {r.extraction.deadlineText}</span>
            )}
            {r.verification?.urlOk === true && (
              <span className="inline-flex items-center gap-1.5 text-[#3FA78E]"><ShieldCheck className="h-3.5 w-3.5" /> URL verified</span>
            )}
            {r.verification && r.verification.urlOk === false && (
              <span className="inline-flex items-center gap-1.5 text-[#F3EEE1]/40"><ShieldCheck className="h-3.5 w-3.5" /> URL not verified</span>
            )}
            {!r.verification?.deadlineOk && !r.extraction.deadlineText && (
              <span className="inline-flex items-center gap-1.5 text-[#F3EEE1]/40"><Calendar className="h-3.5 w-3.5" /> deadline not stated</span>
            )}
          </p>
          <p className="mt-4 max-w-3xl text-sm text-[#F3EEE1]/60 leading-relaxed">{r.evaluation.summary}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            {r.opportunityId && (
              <button
                onClick={() => router.push(`/opportunity/${sessionId}/${r.slug}`)}
                className="inline-flex items-center gap-2 rounded-sm bg-[#C9A227] px-5 py-2.5 text-sm font-semibold text-[#0B0E13] transition-transform hover:-translate-y-0.5"
              >
                <Zap className="h-4 w-4" /> View opportunity
              </button>
            )}
            {r.opportunityId && (
              <button
                onClick={() => router.push(`/applications/${sessionId}`)}
                className="inline-flex items-center gap-2 rounded-sm border border-[#F3EEE1]/15 px-5 py-2.5 text-sm font-semibold text-[#F3EEE1]/70 hover:text-[#F3EEE1] transition-colors"
              >
                <ClipboardCheck className="h-4 w-4" /> Application tracker
              </button>
            )}
            <button
              onClick={() => router.push(`/workspace/${sessionId}`)}
              className="inline-flex items-center gap-2 rounded-sm border border-[#F3EEE1]/15 px-5 py-2.5 text-sm font-semibold text-[#F3EEE1]/70 hover:text-[#F3EEE1] transition-colors"
            >
              <TrendingUp className="h-4 w-4" /> Workspace
            </button>
          </div>
        </motion.div>

        <div className="space-y-5">
          {/* Overview grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] p-5 text-center">
              <p className="font-mono text-[13px] uppercase tracking-[0.15em] text-[#F3EEE1]/35 mb-2">Fit score</p>
              <p className="text-4xl font-medium" style={{ fontFamily: "var(--font-display)", color: r.fitScore >= 65 ? SIGNAL : r.fitScore >= 40 ? BRASS : OCHRE }}>
                {r.fitScore}
                <span className="text-xl text-[#F3EEE1]/25">/100</span>
              </p>
              <p className="mt-2 text-[12px] font-mono text-[#F3EEE1]/35">
                {r.evaluation.grounded ? "evidence-based" : "limited evidence — verify before applying"}
              </p>
            </div>
            <div className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] p-5 text-center">
              <p className="font-mono text-[13px] uppercase tracking-[0.15em] text-[#F3EEE1]/35 mb-2">Skill gaps</p>
              <p className="text-4xl font-medium" style={{ fontFamily: "var(--font-display)" }}>{r.gapAnalysis.skillGaps.length}</p>
              <p className="mt-1 text-[13px] text-[#F3EEE1]/35">~{r.gapAnalysis.estimatedPrepWeeks} weeks to prep</p>
            </div>
            <div className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] p-5 text-center">
              <p className="font-mono text-[13px] uppercase tracking-[0.15em] text-[#F3EEE1]/35 mb-2">Strategy steps</p>
              <p className="text-4xl font-medium" style={{ fontFamily: "var(--font-display)" }}>{r.strategy.timeline.length}</p>
              <p className="mt-1 text-[13px] text-[#F3EEE1]/35">+{r.research.length} similar options found</p>
            </div>
          </div>

          {/* Extraction */}
          <Section title="What the agent extracted" icon={Search}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <InfoRow label="Provider" value={r.extraction.provider} />
              <InfoRow label="Type" value={r.extraction.type} />
              <InfoRow label="Location" value={r.extraction.location || "Not stated"} />
              <InfoRow label="Remote" value={r.extraction.isRemote ? "Yes" : "No"} />
              <InfoRow label="Deadline" value={r.extraction.deadlineText || r.extraction.deadline || "Not stated"} />
              <InfoRow label="Funding" value={r.extraction.fundingDetails || r.extraction.benefits || "Not stated"} />
            </div>
            {r.extraction.description && (
              <p className="mt-5 text-sm text-[#F3EEE1]/55 leading-relaxed">{r.extraction.description}</p>
            )}
            {r.extraction.eligibilityCriteria && (
              <div className="mt-5 rounded-sm border border-[#F3EEE1]/[0.08] bg-[#0B0E13] p-4">
                <p className="mb-2 font-mono text-[13px] uppercase tracking-[0.15em] text-[#C9A227]/70">Eligibility criteria</p>
                <p className="text-sm text-[#F3EEE1]/55 leading-relaxed">{r.extraction.eligibilityCriteria}</p>
              </div>
            )}
            {r.extraction.applicationUrl && (
              <a href={r.extraction.applicationUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm text-[#3FA78E] hover:text-[#3FA78E]/70 transition-colors">
                <Link2 className="h-4 w-4" /> Official application page
              </a>
            )}
          </Section>

          {/* Reasons */}
          {r.evaluation.reasons.length > 0 && (
            <Section title="Why this verdict" icon={Brain}>
              <ul className="space-y-2.5">
                {r.evaluation.reasons.map((reason, i) => (
                  <li key={i} className="flex gap-3 text-sm text-[#F3EEE1]/60">
                    <Award className="h-4 w-4 text-[#C9A227]/60 shrink-0 mt-0.5" />
                    {reason}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Eligibility checklist */}
          {r.evaluation.eligibilityChecklist.length > 0 && (
            <Section title="Eligibility checklist" icon={ClipboardCheck}>
              <div className="space-y-2">
                {r.evaluation.eligibilityChecklist.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-sm border border-[#F3EEE1]/[0.06] bg-[#0B0E13] px-4 py-3">
                    {item.met ? (
                      <CheckCircle2 className="h-4 w-4 text-[#3FA78E] shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-[#C2703D] shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-sm text-[#F3EEE1]/70">{item.item}</p>
                      {item.note && <p className="mt-0.5 text-[13px] text-[#F3EEE1]/35">{item.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Skill gaps + roadmap */}
          <Section title="Skill gaps & learning roadmap" icon={Lightbulb}>
            {r.gapAnalysis.skillGaps.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {r.gapAnalysis.skillGaps.map((g, i) => (
                    <div key={i} className="flex items-center justify-between rounded-sm border border-[#F3EEE1]/[0.06] bg-[#0B0E13] px-4 py-3">
                      <div>
                        <p className="text-sm text-[#F3EEE1]/75">{g.skill}</p>
                        <p className="font-mono text-[13px] text-[#F3EEE1]/35">~{g.effortWeeks} weeks effort</p>
                      </div>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 font-mono text-[12px] uppercase tracking-wider ${
                          g.priority === "high"
                            ? "border-[#C2703D]/40 text-[#C2703D]"
                            : g.priority === "medium"
                            ? "border-[#C9A227]/40 text-[#C9A227]"
                            : "border-[#3FA78E]/40 text-[#3FA78E]"
                        }`}
                      >
                        {g.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
            {r.gapAnalysis.learningRoadmap.length > 0 && (
              <div className="space-y-3">
                {r.gapAnalysis.learningRoadmap.map((phase, i) => (
                  <div key={i} className="relative pl-6">
                    <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-[#C9A227]" />
                    <p className="text-sm font-medium text-[#F3EEE1]/85">{phase.phase}</p>
                    <p className="mt-1 text-sm text-[#F3EEE1]/50">{phase.focus}</p>
                    {phase.resources.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {phase.resources.map((res, j) => (
                          <span key={j} className="rounded-sm border border-[#3FA78E]/25 bg-[#3FA78E]/[0.06] px-2.5 py-1 font-mono text-[12px] text-[#3FA78E]">
                            {res}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Similar opportunities */}
          {r.research.length > 0 && (
            <Section title="Similar opportunities found" icon={Globe}>
              <div className="space-y-2">
                {r.research.map((opp, i) => (
                  <a
                    key={i}
                    href={opp.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 rounded-sm border border-[#F3EEE1]/[0.06] bg-[#0B0E13] px-4 py-3 transition-all hover:border-[#C9A227]/30"
                  >
                    <GraduationCap className="h-4 w-4 text-[#C9A227]/60 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm text-[#F3EEE1]/75 group-hover:text-[#F3EEE1] transition-colors">{opp.title}</p>
                      <p className="mt-0.5 font-mono text-[12px] text-[#F3EEE1]/30">{opp.provider} · {opp.type}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#F3EEE1]/20 shrink-0 ml-auto group-hover:text-[#F3EEE1]/50 transition-colors" />
                  </a>
                ))}
              </div>
            </Section>
          )}

          {/* Strategy timeline */}
          <Section title="Application strategy" icon={Target}>
            <p className="text-sm text-[#F3EEE1]/55 leading-relaxed mb-5">{r.strategy.overview}</p>
            {r.strategy.timeline.length > 0 && (
              <div className="space-y-0">
                {r.strategy.timeline.map((step, i) => (
                  <div key={i} className="relative flex gap-4 pb-5 last:pb-0">
                    {i < r.strategy.timeline.length - 1 && (
                      <span className="absolute left-[13px] top-7 bottom-0 w-px bg-[#F3EEE1]/10" />
                    )}
                    <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#C9A227]/40 bg-[#0B0E13] font-mono text-[12px] text-[#C9A227]">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-mono text-[13px] uppercase tracking-wider text-[#C9A227]/80">{step.week}</p>
                      <p className="mt-0.5 text-sm font-medium text-[#F3EEE1]/85">{step.action}</p>
                      {step.detail && <p className="mt-1 text-sm text-[#F3EEE1]/45">{step.detail}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Documents + checklist + risks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {(r.strategy.documentsNeeded.length > 0 || r.strategy.checklist.length > 0) && (
              <Section title="Documents & checklist" icon={FileText}>
                {r.strategy.documentsNeeded.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {r.strategy.documentsNeeded.map((doc, i) => (
                      <span key={i} className="rounded-sm border border-[#C9A227]/30 bg-[#C9A227]/[0.06] px-2.5 py-1 font-mono text-[12px] text-[#C9A227]">
                        {doc}
                      </span>
                    ))}
                  </div>
                )}
                {r.strategy.checklist.length > 0 && (
                  <ul className="space-y-2">
                    {r.strategy.checklist.map((item, i) => (
                      <li key={i} className="flex gap-2.5 text-sm text-[#F3EEE1]/60">
                        <CheckCircle2 className="h-4 w-4 text-[#3FA78E]/60 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            )}
            {r.strategy.riskFactors.length > 0 && (
              <Section title="Risks to watch" icon={AlertTriangle}>
                <ul className="space-y-2.5">
                  {r.strategy.riskFactors.map((risk, i) => (
                    <li key={i} className="flex gap-3 text-sm text-[#F3EEE1]/60">
                      <AlertTriangle className="h-4 w-4 text-[#C2703D]/70 shrink-0 mt-0.5" />
                      {risk}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>

          {/* Next steps */}
          <Section title="Your next moves" icon={Sparkles}>
            <div className="flex flex-wrap gap-2">
              {r.nextSteps.map((step, i) => (
                <span key={i} className="inline-flex items-center gap-2 rounded-sm border border-[#3FA78E]/25 bg-[#3FA78E]/[0.05] px-3 py-1.5 text-[13px] text-[#3FA78E]">
                  {step}
                </span>
              ))}
            </div>
          </Section>
        </div>
      </main>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[12px] uppercase tracking-[0.15em] text-[#F3EEE1]/30">{label}</p>
      <p className="mt-0.5 text-sm text-[#F3EEE1]/70">{value}</p>
    </div>
  );
}
