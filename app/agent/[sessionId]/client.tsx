"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Loader2, CheckCircle2, XCircle, ArrowRight, AlertCircle, Cpu, Sparkles, Clock,
  Eye, Brain, Target, Search, Database, Shield, FileText, BarChart3, Activity, Lightbulb,
  ChevronRight, Globe, Award, Star, Zap, GraduationCap, Radio, Terminal, ExternalLink,
  Stamp as StampIcon,
} from "lucide-react";
import { AGENT_PERSONAS, resolvePersonaForTool, resolvePersona } from "@/lib/agent/personas";
import type { MissionReport, SubAgentStatus } from "@/lib/types";

const BRASS = "#C9A227";
const SIGNAL = "#3FA78E";
const OCHRE = "#C2703D";

interface PhaseEvent { phase: string; iteration: number; agent?: string }
interface ThoughtEvent { content: string }
interface ToolCallEvent { tool: string; params: unknown }
interface ToolResultEvent { tool: string; result: { summary?: string; success?: boolean; metadata?: Record<string, unknown> } }
interface MemoryUpdateEvent { memories: Array<{ key: string; type: string; importance: number }> }
interface CompleteEvent { summary: string; report?: MissionReport }

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function GrainOverlay() {
  return (
    <svg className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.025] mix-blend-overlay" aria-hidden="true">
      <filter id="grain-agent">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain-agent)" />
    </svg>
  );
}

export function ClientAgentPage({ sessionId, goal }: { sessionId: string; goal: string }) {
  const router = useRouter();
  const [currentPhase, setCurrentPhase] = useState<PhaseEvent | null>(null);
  const [thoughts, setThoughts] = useState<string[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCallEvent[]>([]);
  const [toolResults, setToolResults] = useState<ToolResultEvent[]>([]);
  const [memories, setMemories] = useState<MemoryUpdateEvent[]>([]);
  const [completed, setCompleted] = useState(false);
  const [missionReport, setMissionReport] = useState<MissionReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentThought, setCurrentThought] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [connecting, setConnecting] = useState(true);
  const [subAgents, setSubAgents] = useState<SubAgentStatus[]>([]);
  const [activeAgentId, setActiveAgentId] = useState("commander");
  const [log, setLog] = useState<Array<{ time: string; msg: string; type: "info" | "tool" | "done" | "error" }>>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());
  const completedRef = useRef(false);

  const addLog = useCallback((msg: string, type: "info" | "tool" | "done" | "error" = "info") => {
    const t = new Date().toLocaleTimeString();
    setLog(prev => [...prev.slice(-50), { time: t, msg, type }]);
  }, []);

  useEffect(() => {
    if (!goal) return;
    startTimeRef.current = Date.now();
    setConnecting(true);
    addLog("Initializing agent pipeline...", "info");

    const source = new EventSource(`/api/agent/${sessionId}/stream?goal=${encodeURIComponent(goal)}`);
    source.onopen = () => {
      setConnecting(false);
      addLog("Connected to Gemma 4 autonomous engine", "done");
    };

    source.addEventListener("phase", (e: MessageEvent) => {
      const data: PhaseEvent = JSON.parse(e.data);
      setCurrentPhase(data);

      if (data.phase?.startsWith("agent:")) {
        const agentId = data.phase.replace("agent:", "");
        setActiveAgentId(agentId);
        const p = resolvePersona(agentId);
        addLog(`${p.name} activated — ${data.agent || p.description}`, "info");
        setSubAgents(prev => {
          const existing = prev.find(a => a.id === agentId);
          if (existing) return prev.map(a => a.id === agentId ? { ...a, status: "active" as const } : a);
          return prev;
        });
      }
      if (data.phase?.startsWith("complete:")) {
        const agentId = data.phase.replace("complete:", "");
        const p = resolvePersona(agentId);
        addLog(`${p.name} completed`, "done");
        setSubAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: "complete" as const } : a));
      }
      if (data.phase === "tool_execute") addLog("Executing tool...", "tool");
      if (data.phase === "memory") addLog("Storing to memory", "info");
    });

    source.addEventListener("thought", (e: MessageEvent) => {
      const data: ThoughtEvent = JSON.parse(e.data);
      setThoughts(prev => [...prev, data.content]);
      startTypewriter(data.content);
    });

    source.addEventListener("tool_call", (e: MessageEvent) => {
      const data: ToolCallEvent = JSON.parse(e.data);
      setToolCalls(prev => [...prev, data]);
      addLog(`→ ${data.tool}`, "tool");
      const persona = resolvePersonaForTool(data.tool);
      if (persona.id !== "commander") {
        setSubAgents(prev => prev.map(a => a.id === persona.id ? { ...a, currentTool: data.tool, status: "active" as const } : a));
      }
    });

    source.addEventListener("tool_result", (e: MessageEvent) => {
      const data: ToolResultEvent = JSON.parse(e.data);
      setToolResults(prev => [...prev, data]);
      const status = data.result.success !== false ? "done" : "error";
      addLog(data.result.summary || "Done", status);
    });

    source.addEventListener("memory", (e: MessageEvent) => {
      const data: MemoryUpdateEvent = JSON.parse(e.data);
      setMemories(prev => [...prev, data]);
    });

    source.addEventListener("complete", (e: MessageEvent) => {
      const data: CompleteEvent = JSON.parse(e.data);
      completedRef.current = true;
      setCompleted(true);
      addLog("Mission complete", "done");
      if (data.report) {
        setMissionReport(data.report);
        if (data.report.subAgents) setSubAgents(data.report.subAgents);
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
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

    return () => {
      source.close();
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (typewriterRef.current) clearInterval(typewriterRef.current);
      clearInterval(timer);
    };
  }, [sessionId, goal]);

  function startTypewriter(text: string) {
    if (typewriterRef.current) clearInterval(typewriterRef.current);
    setCurrentThought("");
    let i = 0;
    typewriterRef.current = setInterval(() => {
      if (i < text.length) {
        setCurrentThought(text.slice(0, i + 1));
        i++;
      } else {
        if (typewriterRef.current) clearInterval(typewriterRef.current);
      }
    }, 10);
  }

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  const currentPhaseVal = currentPhase?.phase || "perceive";
  const currentIteration = currentPhase?.iteration || 1;
  const lastToolCall = toolCalls[toolCalls.length - 1];
  const currentPersona = lastToolCall ? resolvePersonaForTool(lastToolCall.tool) : resolvePersona(activeAgentId);
  const completedCount = toolResults.filter(r => r.result.success !== false).length;
  const failedCount = toolResults.filter(r => r.result.success === false).length;
  const activeSubAgent = subAgents.find(a => a.status === "active");

  if (!goal) {
    return (
      <div className="min-h-screen bg-[#0B0E13] flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="mx-auto h-12 w-12 text-[#F3EEE1]/30" strokeWidth={1.5} />
          <h2 className="text-lg font-medium text-[#F3EEE1]" style={{ fontFamily: "var(--font-display)" }}>No mission specified</h2>
          <button onClick={() => router.push("/mission")} className="rounded-sm bg-[#C9A227] px-6 py-2.5 text-sm font-semibold text-[#0B0E13] hover:-translate-y-0.5 transition-all">
            Go to Mission
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E13] text-[#F3EEE1]">
      <GrainOverlay />
      <div className="pointer-events-none fixed -top-40 right-0 z-0 h-[560px] w-[560px] rounded-full bg-[#C9A227]/[0.06] blur-[140px]" />
      <div className="pointer-events-none fixed -bottom-40 left-0 z-0 h-[400px] w-[400px] rounded-full bg-[#3FA78E]/[0.04] blur-[120px]" />

      <div className="mx-auto max-w-7xl px-3 py-3 space-y-3 relative z-10">
        {/* TOP BAR */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D]/90 backdrop-blur-xl px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-[#C9A227]/30 bg-[#C9A227]/10">
                <StampIcon className="h-4 w-4 text-[#C9A227]" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#F3EEE1] font-mono">AGENT_CTRL</span>
                  {!completed && !error && (
                    <span className="inline-flex items-center gap-1 rounded-sm border border-[#3FA78E]/30 bg-[#3FA78E]/10 px-1.5 py-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#3FA78E] animate-pulse" />
                      <span className="text-[13px] font-mono text-[#3FA78E]">LIVE</span>
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-[#F3EEE1]/50 truncate max-w-[200px] sm:max-w-md">{goal}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[14px] font-mono text-[#F3EEE1]/40 shrink-0">
              <span className="hidden sm:flex items-center gap-1"><Cpu className="h-3 w-3" strokeWidth={1.75} /> ITR {currentIteration}/6</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" strokeWidth={1.75} /> {formatTime(elapsed * 1000)}</span>
              <span className="hidden sm:flex items-center gap-1"><Activity className="h-3 w-3" strokeWidth={1.75} /> T{completedCount + failedCount}</span>
              {completed && (
                <>
                  <motion.button initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                    onClick={() => router.push(`/dashboard/${sessionId}`)}
                    className="flex items-center gap-1 rounded-sm bg-[#C9A227]/20 px-2 py-1 text-[13px] font-medium text-[#C9A227] hover:bg-[#C9A227]/30 transition-all">
                    DASH <ArrowRight className="h-2.5 w-2.5" strokeWidth={2} />
                  </motion.button>
                  <motion.button initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                    onClick={() => router.push("/mission")}
                    className="flex items-center gap-1 rounded-sm border border-[#C9A227]/20 px-2 py-1 text-[13px] font-medium text-[#C9A227]/60 hover:bg-[#C9A227]/10 transition-all">
                    + NEW
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* MAIN LAYOUT */}
        <div className="grid lg:grid-cols-12 gap-3">
          {/* LEFT: Agent Pipeline + Terminal */}
          <div className="lg:col-span-8 space-y-3">
            {/* Agent Pipeline */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D]/60 backdrop-blur-xl p-2.5 overflow-x-auto">
              <div className="flex items-center gap-1 min-w-max">
                {["scholarship", "grant", "internship", "research", "web", "eligibility", "career", "document", "application"].map((id, i) => {
                  const p = resolvePersona(id);
                  const Icon = p.icon;
                  const isActive = activeSubAgent?.id === id || activeAgentId === id;
                  const isDone = toolCalls.some(tc => resolvePersonaForTool(tc.tool).id === id);
                  return (
                    <div key={id} className="flex items-center gap-1">
                      <div className={`flex items-center gap-1.5 rounded-sm border px-2 py-1.5 transition-all ${
                        isActive ? "border-[#C9A227]/40 bg-[#C9A227]/10" :
                        isDone ? "border-[#3FA78E]/20 bg-[#3FA78E]/5" : "border-[#F3EEE1]/[0.06] bg-transparent"
                      }`}>
                        <div className={`flex h-5 w-5 items-center justify-center rounded-sm ${isActive ? "bg-[#C9A227]/20" : isDone ? "bg-[#3FA78E]/10" : "bg-[#F3EEE1]/[0.04]"}`}>
                          {isDone ? <CheckCircle2 className="h-3 w-3 text-[#3FA78E]" strokeWidth={2} /> : <Icon className={`h-3 w-3 ${isActive ? "text-[#C9A227] animate-pulse" : "text-[#F3EEE1]/40"}`} strokeWidth={1.75} />}
                        </div>
                        <div className="hidden sm:block">
                          <p className={`text-[14px] font-semibold leading-tight ${isActive ? "text-[#F3EEE1]" : isDone ? "text-[#3FA78E]/70" : "text-[#F3EEE1]/40"}`}>
                            {p.name.split(" ")[0]}
                          </p>
                        </div>
                        {isActive && <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1, repeat: Infinity }} className="h-1.5 w-1.5 rounded-full bg-[#C9A227]" />}
                      </div>
                      {i < 8 && <ChevronRight className={`h-2.5 w-2.5 ${isDone ? "text-[#3FA78E]/40" : "text-[#F3EEE1]/[0.06]"} shrink-0`} strokeWidth={1.5} />}
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* CURRENT AGENT STATUS CARD */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-sm border border-[#C9A227]/20 bg-[#12161D] p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-[#C9A227]/30 bg-[#C9A227]/10">
                  <currentPersona.icon className="h-5 w-5 text-[#C9A227]" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#F3EEE1]">{activeSubAgent?.name || currentPersona.name}</span>
                    {!completed && !error && (
                      <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-[13px] font-mono text-[#C9A227] px-1.5 py-0.5 rounded-sm bg-[#C9A227]/10 border border-[#C9A227]/20">
                        {currentPhaseVal.replace("agent:", "").replace("complete:", "").toUpperCase()}
                      </motion.span>
                    )}
                  </div>
                  <p className="text-[13px] text-[#F3EEE1]/50">{activeSubAgent?.currentTask || currentPersona.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-[#C9A227]" style={{ fontFamily: "var(--font-mono)" }}>
                    {completed ? 100 : subAgents.find(a => a.status === "complete") ? Math.min(95, subAgents.filter(a => a.status === "complete").length * 8 + 10) : 10}%
                  </div>
                  <p className="text-[13px] text-[#F3EEE1]/40 font-mono">COMPLETE</p>
                </div>
              </div>
              <div className="mt-2.5 h-1 w-full rounded-full bg-[#F3EEE1]/[0.06] overflow-hidden">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-[#C9A227] to-[#C9A227]/60"
                  initial={{ width: "0%" }}
                  animate={{ width: `${Math.min(100, (subAgents.filter(a => a.status === "complete").length / 9) * 100)}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }} />
              </div>
            </motion.div>

            {/* TERMINAL OUTPUT */}
            <div className="rounded-sm border border-[#F3EEE1]/10 bg-[#0B0E13] overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#F3EEE1]/10 px-3 py-2 bg-[#12161D]/50">
                <div className="flex items-center gap-2">
                  <Terminal className="h-3 w-3 text-[#3FA78E]" strokeWidth={1.75} />
                  <span className="text-[14px] font-semibold text-[#3FA78E] font-mono">agent_terminal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#3FA78E]/50" />
                  <span className="h-2 w-2 rounded-full bg-[#C9A227]/50" />
                  <span className="h-2 w-2 rounded-full bg-[#C2703D]/50" />
                </div>
              </div>
              <div className="p-3 space-y-1 max-h-[280px] overflow-y-auto font-mono text-[13px] leading-relaxed">
                {connecting && (
                  <div className="flex items-center gap-2 text-[#3FA78E]">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>$ connecting to gemma-4-27b-it...</span>
                  </div>
                )}

                {currentThought && !completed && !error && (
                  <div className="text-[#3FA78E]/90 py-1">
                    <span className="text-[#F3EEE1]/40">$ </span>{currentThought}
                    <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.8, repeat: Infinity }} className="text-[#3FA78E]">_</motion.span>
                  </div>
                )}

                {log.slice(-15).map((entry, i) => (
                  <div key={i} className={`${
                    entry.type === "done" ? "text-[#3FA78E]" :
                    entry.type === "error" ? "text-[#C2703D]" :
                    entry.type === "tool" ? "text-[#C9A227]" : "text-[#F3EEE1]/50"
                  }`}>
                    <span className="text-[#F3EEE1]/20">[{entry.time}]</span> $ {entry.msg}
                  </div>
                ))}

                {completed && (
                  <div className="text-[#3FA78E] font-bold py-1">
                    <span className="text-[#F3EEE1]/40">$ </span>mission_complete ✓
                  </div>
                )}

                {error && (
                  <div className="text-[#C2703D] py-1">
                    <span className="text-[#F3EEE1]/40">$ </span>error: {error}
                  </div>
                )}

                <div ref={logEndRef} />
              </div>
            </div>

            {/* OPPORTUNITIES SEEN — rich detailed cards */}
            {(() => {
              const allOpps = toolResults
                .filter(tr => tr.tool === "search_opportunities" || tr.tool === "web_search")
                .flatMap(tr => {
                  const items = (tr.result as any)?.data;
                  return Array.isArray(items) ? items : [];
                });
              if (allOpps.length === 0) return null;
              return (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <Award className="h-4 w-4 text-[#C9A227]" strokeWidth={1.75} />
                    <span className="text-sm font-semibold text-[#F3EEE1] tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
                      Discovered Opportunities
                    </span>
                    <span className="ml-auto text-sm font-mono text-[#C9A227] bg-[#C9A227]/10 px-2 py-0.5 rounded-sm border border-[#C9A227]/20">
                      {allOpps.length} found
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {allOpps.slice(0, 10).map((item: any, idx: number) => {
                      const hasUrl = item.applicationUrl || item.url;
                      const isWebResult = !!item.url;
                      const daysLeft = item.deadline ? Math.ceil((new Date(item.deadline).getTime() - Date.now()) / 86400000) : null;
                      return (
                        <motion.div
                          key={`opp-${idx}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="rounded-sm border border-[#F3EEE1]/[0.08] bg-[#0B0E13]/80 hover:border-[#C9A227]/25 hover:bg-[#0B0E13] transition-all group"
                        >
                          {/* Header: Title + badges */}
                          <div className="border-b border-[#F3EEE1]/[0.04] px-4 py-3 flex items-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-[#C9A227]/10">
                              <Star className="h-4 w-4 text-[#C9A227]" strokeWidth={1.75} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-[#F3EEE1] leading-snug line-clamp-2 group-hover:text-[#C9A227] transition-colors" style={{ fontFamily: "var(--font-display)" }}>
                                {item.title || "Opportunity"}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                <span className="inline-flex items-center gap-1 text-[13px] font-mono font-semibold text-[#3FA78E] bg-[#3FA78E]/10 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                                  {item.type || (isWebResult ? "web" : "opportunity")}
                                </span>
                                {item.provider && (
                                  <span className="text-[14px] text-[#F3EEE1]/50 font-medium">{item.provider}</span>
                                )}
                                {item.location && (
                                  <span className="text-[14px] text-[#F3EEE1]/35">· {item.location}</span>
                                )}
                                {item.isRemote && (
                                  <span className="text-[13px] text-[#3FA78E]/60 font-mono">· Remote</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Description */}
                          <div className="px-4 py-2.5">
                            <p className="text-[13px] text-[#F3EEE1]/60 leading-relaxed line-clamp-3">
                              {item.description || "No description available."}
                            </p>
                          </div>

                          {/* Eligibility */}
                          {item.eligibilityCriteria && (
                            <div className="px-4 pb-1.5">
                              <div className="rounded-sm bg-[#F3EEE1]/[0.03] border border-[#F3EEE1]/[0.05] px-3 py-2">
                                <p className="text-[12px] font-mono font-semibold text-[#F3EEE1]/40 uppercase tracking-wider mb-1">Eligibility Criteria</p>
                                <p className="text-[14px] text-[#F3EEE1]/55 leading-relaxed line-clamp-3">{item.eligibilityCriteria}</p>
                              </div>
                            </div>
                          )}

                          {/* AI Advice */}
                          {item.advice && (
                            <div className="px-4 pb-1.5">
                              <div className="rounded-sm bg-[#C9A227]/[0.04] border border-[#C9A227]/15 px-3 py-2">
                                <p className="text-[12px] font-mono font-semibold text-[#C9A227]/60 uppercase tracking-wider mb-1">AI Recommendation</p>
                                <p className="text-[14px] text-[#C9A227]/70 leading-relaxed line-clamp-3">{item.advice}</p>
                              </div>
                            </div>
                          )}

                          {/* Tags */}
                          {item.tags && Array.isArray(item.tags) && item.tags.length > 0 && (
                            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                              {item.tags.slice(0, 6).map((tag: string, t: number) => (
                                <span key={t} className="text-[12px] font-mono text-[#C9A227]/50 bg-[#C9A227]/[0.06] px-2 py-0.5 rounded-sm border border-[#C9A227]/10">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Footer */}
                          <div className="border-t border-[#F3EEE1]/[0.04] px-4 py-2.5 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {daysLeft !== null && (
                                <span className={`text-[14px] font-mono font-semibold ${
                                  daysLeft <= 30 ? "text-[#C2703D]" : "text-[#F3EEE1]/50"
                                }`}>
                                  {daysLeft <= 0 ? "Due today" : `${daysLeft}d left`}
                                </span>
                              )}
                              {item.deadline && (
                                <span className="text-[13px] font-mono text-[#F3EEE1]/35">
                                  {new Date(item.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </span>
                              )}
                              {isWebResult && (
                                <span className="text-[12px] font-mono text-[#3FA78E]/50">· web</span>
                              )}
                            </div>
                            {hasUrl ? (
                              <a
                                href={item.applicationUrl || item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-sm bg-[#C9A227] px-3 py-1.5 text-[14px] font-semibold text-[#0B0E13] hover:bg-[#C9A227]/90 transition-all shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Apply <ExternalLink className="h-3 w-3" strokeWidth={2.5} />
                              </a>
                            ) : (
                              <span className="text-[13px] text-[#F3EEE1]/30 font-mono italic">Apply info pending</span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  {allOpps.length > 8 && (
                    <p className="text-center text-sm text-[#F3EEE1]/30 mt-3 font-mono">
                      +{allOpps.length - 8} more opportunities — visit{" "}
                      <button onClick={() => router.push(`/workspace/${sessionId}`)} className="text-[#C9A227]/60 hover:text-[#C9A227] underline decoration-dotted underline-offset-2">
                        workspace
                      </button>{" "}
                      to view all
                    </p>
                  )}
                </motion.div>
              );
            })()}
          </div>

          {/* RIGHT: Agent Roster + Memory */}
          <div className="lg:col-span-4 space-y-3">
            {/* AGENT ROSTER */}
            <div className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D]/60 backdrop-blur-xl p-2.5">
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <Radio className="h-3 w-3 text-[#C9A227]" strokeWidth={1.75} />
                <span className="text-[13px] font-semibold text-[#F3EEE1]/50 uppercase tracking-wider font-mono">Agent Roster</span>
                <span className="ml-auto text-[13px] font-mono text-[#F3EEE1]/40">
                  {subAgents.filter(a => a.status === "complete").length}/{toolCalls.length > 0 ? toolCalls.length + 1 : 9}
                </span>
              </div>
              <div className="space-y-1">
                {["scholarship", "grant", "internship", "research", "web", "eligibility", "career", "document", "application"].map((id) => {
                  const p = resolvePersona(id);
                  const Icon = p.icon;
                  const isActive = activeSubAgent?.id === id || activeAgentId === id;
                  const isDone = toolCalls.some(tc => resolvePersonaForTool(tc.tool).id === id);
                  return (
                    <div key={id} className={`flex items-center gap-2 rounded-sm px-2.5 py-1.5 transition-all ${
                      isActive ? "bg-[#C9A227]/10 border border-[#C9A227]/20" :
                      isDone ? "bg-[#3FA78E]/5 border border-[#3FA78E]/10" : "border border-transparent opacity-40"
                    }`}>
                      <div className={`flex h-6 w-6 items-center justify-center rounded-sm ${isActive ? "bg-[#C9A227]/20" : isDone ? "bg-[#3FA78E]/10" : "bg-[#F3EEE1]/[0.04]"}`}>
                        {isDone ? <CheckCircle2 className="h-3 w-3 text-[#3FA78E]" strokeWidth={2} /> : <Icon className={`h-3 w-3 ${isActive ? "text-[#C9A227] animate-pulse" : "text-[#F3EEE1]/40"}`} strokeWidth={1.75} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[14px] font-medium ${isActive ? "text-[#F3EEE1]" : isDone ? "text-[#3FA78E]/70" : "text-[#F3EEE1]/40"}`}>
                            {p.name.split(" ")[0]}
                          </span>
                          {isActive && <Loader2 className="h-2.5 w-2.5 text-[#C9A227] animate-spin" />}
                          {isDone && <CheckCircle2 className="h-2.5 w-2.5 text-[#3FA78E]/50" strokeWidth={2} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STATS */}
            {toolResults.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D]/60 backdrop-blur-xl p-2.5">
                <div className="flex items-center gap-1.5 mb-2 px-1">
                  <BarChart3 className="h-3 w-3 text-[#3FA78E]" strokeWidth={1.75} />
                  <span className="text-[13px] font-semibold text-[#F3EEE1]/50 uppercase tracking-wider font-mono">Telemetry</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: "AGENTS", value: `${subAgents.filter(a => a.status === "complete").length}/9`, color: "text-[#C9A227]" },
                    { label: "TOOLS", value: `${completedCount + failedCount}`, color: "text-[#F3EEE1]" },
                    { label: "SUCCESS", value: completedCount + failedCount > 0 ? `${Math.round(completedCount / (completedCount + failedCount) * 100)}%` : "0%", color: "text-[#3FA78E]" },
                    { label: "ELAPSED", value: formatTime(elapsed * 1000), color: "text-[#F3EEE1]/50" },
                  ].map(s => (
                    <div key={s.label} className="rounded-sm bg-[#0B0E13]/50 border border-[#F3EEE1]/[0.06] px-2.5 py-2">
                      <p className={`text-sm font-bold font-mono ${s.color}`}>{s.value}</p>
                      <p className="text-[13px] text-[#F3EEE1]/40 font-mono mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* MEMORY QUICK VIEW */}
            <div className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D]/60 backdrop-blur-xl p-2.5">
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <Database className="h-3 w-3 text-[#3FA78E]" strokeWidth={1.75} />
                <span className="text-[13px] font-semibold text-[#F3EEE1]/50 uppercase tracking-wider font-mono">Memory Buffer</span>
              </div>
              <div className="space-y-1 max-h-[120px] overflow-y-auto">
                {memories.length === 0 && (
                  <p className="text-[14px] text-[#F3EEE1]/40 px-1">
                    {completed ? "No memories stored" : "Awaiting memory writes..."}
                  </p>
                )}
                {memories.slice(-4).reverse().flatMap((m, i) =>
                  m.memories.slice(0, 1).map((mem, j) => (
                    <div key={`${i}-${j}`} className="flex items-center gap-2 rounded-sm bg-[#0B0E13]/50 border border-[#F3EEE1]/[0.06] px-2 py-1.5">
                      <Database className="h-2.5 w-2.5 text-[#3FA78E]/50 shrink-0" strokeWidth={1.5} />
                      <span className="text-[13px] text-[#F3EEE1]/50 truncate flex-1 font-mono">{mem.key}</span>
                      <span className="text-[13px] text-[#F3EEE1]/40 font-mono">{Math.round(mem.importance * 100)}%</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* MISSION REPORT */}
            <AnimatePresence>
              {completed && missionReport && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="rounded-sm border border-[#3FA78E]/20 bg-[#3FA78E]/5 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-[#3FA78E]" strokeWidth={2} />
                    <span className="text-[14px] font-semibold text-[#3FA78E] uppercase tracking-wider font-mono">Mission Complete</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 mb-2">
                    <div className="text-center bg-[#0B0E13]/50 rounded-sm p-1.5">
                      <p className="text-sm font-bold text-[#3FA78E] font-mono">{missionReport.missionSuccess}%</p>
                      <p className="text-[13px] text-[#F3EEE1]/40 font-mono">SUCCESS</p>
                    </div>
                    <div className="text-center bg-[#0B0E13]/50 rounded-sm p-1.5">
                      <p className="text-sm font-bold text-[#F3EEE1] font-mono">{missionReport.iterations}</p>
                      <p className="text-[13px] text-[#F3EEE1]/40 font-mono">LOOPS</p>
                    </div>
                    <div className="text-center bg-[#0B0E13]/50 rounded-sm p-1.5">
                      <p className="text-sm font-bold text-[#C9A227] font-mono">{missionReport.documentsGenerated}</p>
                      <p className="text-[13px] text-[#F3EEE1]/40 font-mono">DOCS</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => router.push(`/dashboard/${sessionId}`)}
                      className="flex-1 rounded-sm bg-[#C9A227] px-2.5 py-1.5 text-[14px] font-semibold text-[#0B0E13] hover:-translate-y-0.5 transition-all">Dashboard</button>
                    <button onClick={() => router.push(`/memory/${sessionId}`)}
                      className="flex-1 rounded-sm border border-[#F3EEE1]/10 px-2.5 py-1.5 text-[14px] font-medium text-[#F3EEE1]/60 hover:bg-[#F3EEE1]/[0.03] transition-all">Memory</button>
                    <button onClick={() => router.push("/mission")}
                      className="flex-1 rounded-sm border border-[#C9A227]/30 px-2.5 py-1.5 text-[14px] font-medium text-[#C9A227]/70 hover:bg-[#C9A227]/10 transition-all">+ New Mission</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}