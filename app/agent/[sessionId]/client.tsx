"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Loader2, CheckCircle2, XCircle, ArrowRight, AlertCircle, Cpu, Sparkles, Clock,
  Eye, Brain, Target, Search, Database, Shield, FileText, BarChart3, Activity, Lightbulb,
  ChevronRight, Globe, Award, Star, Zap, GraduationCap, Radio, Terminal, ScanLine
} from "lucide-react";
import { AGENT_PERSONAS, resolvePersonaForTool, resolvePersona } from "@/lib/agent/personas";
import type { MissionReport, SubAgentStatus } from "@/lib/types";

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

function AgentIcon({ id }: { id: string }) {
  const p = resolvePersona(id);
  const Icon = p.icon;
  return <Icon className={`h-3.5 w-3.5 ${p.color}`} />;
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
      if (data.phase === "tool_execute") {
        addLog("Executing tool...", "tool");
      }
      if (data.phase === "memory") {
        addLog("Storing to memory", "info");
      }
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h2 className="text-lg font-semibold">No mission specified</h2>
          <button onClick={() => router.push("/mission")} className="btn-primary px-6 py-2.5 text-sm rounded-xl">Go to Mission</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* SCAN LINES */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.015]" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px)" }} />

      <div className="mx-auto max-w-7xl px-3 py-3 space-y-3 relative z-10">
        {/* TOP BAR */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-muted/80 backdrop-blur-xl px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7C3AED]/30 to-[#7C3AED]/5 border border-[#7C3AED]/20">
                <Bot className="h-4 w-4 text-[#7C3AED]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">AGENT_CTRL</span>
                  {!completed && !error && (
                    <span className="inline-flex items-center gap-1 rounded border border-[#22C55E]/30 bg-[#22C55E]/10 px-1.5 py-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                      <span className="text-[11px] font-mono text-[#22C55E]">LIVE</span>
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-muted-foreground truncate max-w-[200px] sm:max-w-md">{goal}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[12px] font-mono text-muted-foreground/80 shrink-0">
              <span className="hidden sm:flex items-center gap-1"><Cpu className="h-3 w-3" /> ITR {currentIteration}/12</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatTime(elapsed * 1000)}</span>
              <span className="hidden sm:flex items-center gap-1"><Activity className="h-3 w-3" /> T{completedCount + failedCount}</span>
              {completed && (
                <motion.button initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                  onClick={() => router.push(`/dashboard/${sessionId}`)}
                  className="flex items-center gap-1 rounded-md bg-[#7C3AED]/20 px-2 py-1 text-[11px] font-medium text-[#7C3AED] hover:bg-[#7C3AED]/30">DASH <ArrowRight className="h-2.5 w-2.5" /></motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* MAIN LAYOUT */}
        <div className="grid lg:grid-cols-12 gap-3">
          {/* LEFT: Agent Pipeline + Terminal */}
          <div className="lg:col-span-8 space-y-3">
            {/* Agent Pipeline - Horizontal Flow */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="rounded-xl border border-border bg-muted/60 backdrop-blur-xl p-2.5 overflow-x-auto">
              <div className="flex items-center gap-1 min-w-max">
                {["scholarship", "grant", "internship", "research", "web", "eligibility", "career", "document", "application"].map((id, i) => {
                  const p = resolvePersona(id);
                  const Icon = p.icon;
                  const isActive = activeSubAgent?.id === id || activeAgentId === id;
                  const isDone = toolCalls.some(tc => resolvePersonaForTool(tc.tool).id === id);
                  return (
                    <div key={id} className="flex items-center gap-1">
                      <div className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 transition-all ${
                        isActive ? "border-[#7C3AED]/40 bg-[#7C3AED]/10 shadow-lg shadow-[#7C3AED]/10" :
                        isDone ? "border-[#22C55E]/20 bg-[#22C55E]/5" : "border-border/30 bg-muted/20"
                      }`}>
                        <div className={`flex h-5 w-5 items-center justify-center rounded ${isActive ? "bg-[#7C3AED]/20" : isDone ? "bg-[#22C55E]/10" : "bg-muted/40"}`}>
                          {isDone ? <CheckCircle2 className="h-3 w-3 text-[#22C55E]" /> : <Icon className={`h-3 w-3 ${p.color} ${isActive ? "animate-pulse" : ""}`} />}
                        </div>
                        <div className="hidden sm:block">
                          <p className={`text-[12px] font-semibold leading-tight ${isActive ? "text-foreground" : isDone ? "text-[#22C55E]/70" : "text-muted-foreground/80"}`}>{p.name.split(" ")[0]}</p>
                        </div>
                        {isActive && <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1, repeat: Infinity }} className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />}
                      </div>
                      {i < 8 && <ChevronRight className={`h-2.5 w-2.5 ${isDone ? "text-[#22C55E]/40" : "text-muted-foreground/80/20"} shrink-0`} />}
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* CURRENT AGENT STATUS CARD */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-[#7C3AED]/20 bg-card shadow-lg shadow-[#7C3AED]/5 p-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${currentPersona.gradient} border border-border`}>
                  <currentPersona.icon className={`h-5 w-5 ${currentPersona.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{activeSubAgent?.name || currentPersona.name}</span>
                    {!completed && !error && (
                      <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-[11px] font-mono text-[#7C3AED] px-1.5 py-0.5 rounded bg-[#7C3AED]/10 border border-[#7C3AED]/20">
                        {currentPhaseVal.replace("agent:", "").replace("complete:", "").toUpperCase()}
                      </motion.span>
                    )}
                  </div>
                  <p className="text-[13px] text-muted-foreground">{activeSubAgent?.currentTask || currentPersona.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-[#7C3AED]">
                    {completed ? 100 : subAgents.find(a => a.status === "complete") ? Math.min(95, subAgents.filter(a => a.status === "complete").length * 8 + 10) : 10}%
                  </div>
                  <p className="text-[11px] text-muted-foreground/80 font-mono">COMPLETE</p>
                </div>
              </div>
              <div className="mt-2.5 h-1 w-full rounded-full bg-muted/50 overflow-hidden">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6]"
                  initial={{ width: "0%" }}
                  animate={{ width: `${Math.min(100, (subAgents.filter(a => a.status === "complete").length / 9) * 100)}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }} />
              </div>
            </motion.div>

            {/* TERMINAL OUTPUT */}
            <div className="rounded-xl border border-border bg-background overflow-hidden shadow-inner">
              <div className="flex items-center justify-between border-b border-border px-3 py-2 bg-muted/50">
                <div className="flex items-center gap-2">
                  <Terminal className="h-3 w-3 text-[#22C55E]" />
                  <span className="text-[12px] font-semibold text-[#22C55E] font-mono">agent_terminal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#22C55E]/50" />
                  <span className="h-2 w-2 rounded-full bg-[#F59E0B]/50" />
                  <span className="h-2 w-2 rounded-full bg-[#EF4444]/50" />
                </div>
              </div>
              <div className="p-3 space-y-1 max-h-[280px] overflow-y-auto font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {/* Connecting */}
                {connecting && (
                  <div className="flex items-center gap-2 text-[13px] text-[#22C55E]">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>$ connecting to gemma-4-27b-it...</span>
                  </div>
                )}

                {/* Current reasoning streaming */}
                {currentThought && !completed && !error && (
                  <div className="text-[13px] text-[#22C55E]/90 leading-relaxed py-1">
                    <span className="text-muted-foreground/80">$ </span>{currentThought}
                    <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.8, repeat: Infinity }} className="text-[#22C55E]">_</motion.span>
                  </div>
                )}

                {/* Log entries */}
                {log.slice(-15).map((entry, i) => (
                  <div key={i} className={`text-[13px] leading-relaxed ${
                    entry.type === "done" ? "text-[#22C55E]" : entry.type === "error" ? "text-[#EF4444]" : entry.type === "tool" ? "text-[#7C3AED]" : "text-muted-foreground"
                  }`}>
                    <span className="text-muted-foreground/80">[{entry.time}]</span> $ {entry.msg}
                  </div>
                ))}

                {completed && (
                  <div className="text-[13px] text-[#22C55E] font-bold py-1">
                    <span className="text-muted-foreground/80">$ </span>mission_complete ✓
                  </div>
                )}

                {error && (
                  <div className="text-[13px] text-[#EF4444] py-1">
                    <span className="text-muted-foreground/80">$ </span>error: {error}
                  </div>
                )}

                <div ref={logEndRef} />
              </div>
            </div>
          </div>

          {/* RIGHT: Agent Roster + Memory */}
          <div className="lg:col-span-4 space-y-3">
            {/* AGENT ROSTER */}
            <div className="rounded-xl border border-border bg-muted/60 backdrop-blur-xl p-2.5">
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <Radio className="h-3 w-3 text-[#7C3AED]" />
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Agent Roster</span>
                <span className="ml-auto text-[11px] font-mono text-muted-foreground/80">{subAgents.filter(a => a.status === "complete").length}/{toolCalls.length > 0 ? toolCalls.length + 1 : 9}</span>
              </div>
              <div className="space-y-1">
                {["scholarship", "grant", "internship", "research", "web", "eligibility", "career", "document", "application"].map((id) => {
                  const p = resolvePersona(id);
                  const Icon = p.icon;
                  const isActive = activeSubAgent?.id === id || activeAgentId === id;
                  const isDone = toolCalls.some(tc => resolvePersonaForTool(tc.tool).id === id);
                  return (
                    <div key={id} className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-all ${
                      isActive ? "bg-[#7C3AED]/10 border border-[#7C3AED]/20" : isDone ? "bg-[#22C55E]/5 border border-[#22C55E]/10" : "border border-transparent opacity-40"
                    }`}>
                      <div className={`flex h-6 w-6 items-center justify-center rounded-md ${isActive ? "bg-[#7C3AED]/20" : isDone ? "bg-[#22C55E]/10" : "bg-muted/40"}`}>
                        {isDone ? <CheckCircle2 className="h-3 w-3 text-[#22C55E]" /> : <Icon className={`h-3 w-3 ${p.color} ${isActive ? "animate-pulse" : ""}`} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[12px] font-medium ${isActive ? "text-foreground" : isDone ? "text-[#22C55E]/70" : "text-muted-foreground/80"}`}>
                            {p.name.split(" ")[0]}
                          </span>
                          {isActive && <Loader2 className="h-2.5 w-2.5 text-[#7C3AED] animate-spin" />}
                            {isDone && <CheckCircle2 className="h-2.5 w-2.5 text-[#22C55E]/50" />}
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
                className="rounded-xl border border-border bg-muted/60 backdrop-blur-xl p-2.5">
                <div className="flex items-center gap-1.5 mb-2 px-1">
                  <BarChart3 className="h-3 w-3 text-[#8B5CF6]" />
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Telemetry</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: "AGENTS", value: `${subAgents.filter(a => a.status === "complete").length}/9`, color: "text-[#7C3AED]" },
                    { label: "TOOLS", value: `${completedCount + failedCount}`, color: "text-foreground" },
                    { label: "SUCCESS", value: completedCount + failedCount > 0 ? `${Math.round(completedCount / (completedCount + failedCount) * 100)}%` : "0%", color: "text-[#22C55E]" },
                    { label: "ELAPSED", value: formatTime(elapsed * 1000), color: "text-muted-foreground" },
                  ].map(s => (
                    <div key={s.label} className="rounded-lg bg-background/50 border border-border/40 px-2.5 py-2">
                      <p className={`text-sm font-bold font-mono ${s.color}`}>{s.value}</p>
                      <p className="text-[11px] text-muted-foreground/80 font-mono mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* MEMORY QUICK VIEW */}
            <div className="rounded-xl border border-border bg-muted/60 backdrop-blur-xl p-2.5">
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <Database className="h-3 w-3 text-[#8B5CF6]" />
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Memory Buffer</span>
              </div>
              <div className="space-y-1 max-h-[120px] overflow-y-auto">
                {memories.length === 0 && (
                  <p className="text-[12px] text-muted-foreground/80 px-1">
                    {completed ? "No memories stored" : "Awaiting memory writes..."}
                  </p>
                )}
                {memories.slice(-4).reverse().flatMap((m, i) =>
                  m.memories.slice(0, 1).map((mem, j) => (
                    <div key={`${i}-${j}`} className="flex items-center gap-2 rounded bg-background/50 border border-border/40 px-2 py-1.5">
                      <Database className="h-2.5 w-2.5 text-[#8B5CF6]/50 shrink-0" />
                      <span className="text-[11px] text-muted-foreground truncate flex-1 font-mono">{mem.key}</span>
                      <span className="text-[13px] text-muted-foreground/80 font-mono">{Math.round(mem.importance * 100)}%</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* MISSION REPORT */}
            <AnimatePresence>
              {completed && missionReport && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="rounded-xl border border-[#22C55E]/20 bg-[#22C55E]/5 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                    <span className="text-[12px] font-semibold text-[#22C55E] uppercase tracking-wider">Mission Complete</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 mb-2">
                    <div className="text-center bg-background/50 rounded-lg p-1.5">
                      <p className="text-sm font-bold text-[#22C55E] font-mono">{missionReport.missionSuccess}%</p>
                      <p className="text-[13px] text-muted-foreground/80">SUCCESS</p>
                    </div>
                    <div className="text-center bg-background/50 rounded-lg p-1.5">
                      <p className="text-sm font-bold text-foreground font-mono">{missionReport.iterations}</p>
                      <p className="text-[13px] text-muted-foreground/80">LOOPS</p>
                    </div>
                    <div className="text-center bg-background/50 rounded-lg p-1.5">
                      <p className="text-sm font-bold text-[#7C3AED] font-mono">{missionReport.documentsGenerated}</p>
                      <p className="text-[13px] text-muted-foreground/80">DOCS</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => router.push(`/dashboard/${sessionId}`)}
                      className="flex-1 rounded-lg bg-[#7C3AED] px-2.5 py-1.5 text-[12px] font-semibold text-white hover:bg-[#7C3AED]/90 transition-all">Dashboard</button>
                    <button onClick={() => router.push(`/memory/${sessionId}`)}
                      className="flex-1 rounded-lg border border-border px-2.5 py-1.5 text-[12px] font-medium hover:bg-muted/50 transition-all">Memory</button>
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
