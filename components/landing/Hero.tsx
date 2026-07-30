"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import {
  Bot, ArrowRight, Sparkles, Search, Brain, FileText, CheckCircle2,
  Loader2, Cpu, Target, Clock, Activity, BarChart3
} from "lucide-react";
import { AGENT_PERSONAS, resolvePersonaForTool, getPersonaConfidence } from "@/lib/agent/personas";

const EXAMPLES = [
  "Find fully funded AI Master's scholarships in Europe",
  "I need AI/ML internships in Europe for summer 2027",
  "Discover tech fellowships for Kenyan engineering graduates",
  "Find conference funding for renewable energy research in Africa",
];

interface ActivityStep {
  persona: typeof AGENT_PERSONAS[0];
  action: string;
  status: "pending" | "active" | "done";
}

export function Hero() {
  const router = useRouter();
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentAgentIdx, setCurrentAgentIdx] = useState(0);
  const [activityLog, setActivityLog] = useState<ActivityStep[]>([]);

  // Animate agent activity
  useEffect(() => {
    const activities = [
      { persona: AGENT_PERSONAS[1], action: "Searching scholarship databases..." },
      { persona: AGENT_PERSONAS[2], action: "Searching grant programs..." },
      { persona: AGENT_PERSONAS[3], action: "Finding internship opportunities..." },
      { persona: AGENT_PERSONAS[6], action: "Scraping official websites..." },
      { persona: AGENT_PERSONAS[7], action: "Analyzing eligibility requirements..." },
      { persona: AGENT_PERSONAS[10], action: "Generating application documents..." },
    ];

    const addInterval = setInterval(() => {
      if (currentAgentIdx < activities.length) {
        const act = activities[currentAgentIdx];
        setActivityLog((prev) => [
          ...prev,
          { persona: act.persona, action: act.action, status: "active" },
        ]);
        // Mark previous as done
        setActivityLog((prev) =>
          prev.map((p, i) => (i === prev.length - 2 ? { ...p, status: "done" as const } : p))
        );
        setCurrentAgentIdx((p) => p + 1);
      }
    }, 1500);

    return () => clearInterval(addInterval);
  }, [currentAgentIdx]);

  function launchAgent(e?: React.FormEvent) {
    e?.preventDefault();
    if (!goal.trim()) return;
    setLoading(true);
    const sessionId = uuidv4();
    sessionStorage.setItem(`agent_${sessionId}_goal`, goal);
    router.push(`/agent/${sessionId}?goal=${encodeURIComponent(goal)}`);
  }

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-24 pb-16">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-transparent to-background" />
      <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-6 w-full">
        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* Left: Mission Input (2/5) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-2 space-y-6 lg:sticky lg:top-24"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5">
              <Bot className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Powered by Gemma 4</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
              Delegate Your Search to an{" "}
              <span className="text-gradient">Autonomous AI Team</span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground/80 leading-relaxed font-medium">
              One mission. 14 specialized AI agents collaborate autonomously — discovering opportunities,
              analyzing eligibility, generating applications, and preparing everything you need.
            </p>

            {/* Mission input form */}
            <form onSubmit={launchAgent} className="space-y-3">
              <div className="relative">
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Describe your mission..."
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl p-4 text-sm text-foreground placeholder:text-muted-foreground/30 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={!goal.trim() || loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Launching Agent Team...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> Launch Autonomous AI
                  </span>
                )}
              </button>
            </form>

            {/* Example missions */}
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground/40 font-medium uppercase tracking-wider">Try an example</p>
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLES.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => setGoal(ex)}
                    className="rounded-full border border-white/5 bg-white/[0.02] px-3 py-1 text-[10px] text-muted-foreground/50 hover:bg-white/[0.05] hover:text-foreground/70 hover:border-white/10 transition-all"
                  >
                    {ex.length > 35 ? ex.slice(0, 35) + "..." : ex}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats line */}
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground/40">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-400/60" /> 14 specialized agents
              </span>
              <span className="w-px h-3 bg-white/10" />
              <span className="flex items-center gap-1">
                <Cpu className="h-3 w-3 text-primary/60" /> 10+ tools
              </span>
              <span className="w-px h-3 bg-white/10" />
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-violet-400/60" /> No signup
              </span>
            </div>
          </motion.div>

          {/* Right: Live Mission Control (3/5) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-3 space-y-4"
          >
            {/* Stats header */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Agents", value: "14", icon: Bot, color: "text-primary" },
                { label: "Tools", value: "10+", icon: Activity, color: "text-cyan-400" },
                { label: "Sources", value: "8+", icon: Search, color: "text-blue-400" },
                { label: "Documents", value: "Auto", icon: FileText, color: "text-ash-400" },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
                    <Icon className={`h-4 w-4 ${stat.color} mx-auto mb-1`} />
                    <div className="text-lg font-bold text-foreground/80">{stat.value}</div>
                    <p className="text-[9px] text-muted-foreground/40">{stat.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Agent Activity Panel */}
            <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/20">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-xs font-semibold">Live Agent Activity</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <motion.div
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="h-1.5 w-1.5 rounded-full bg-ash-400"
                  />
                  <span className="text-[9px] font-mono text-ash-400/70">LIVE</span>
                </div>
              </div>

              <div className="p-4 space-y-2 min-h-[300px]">
                {/* Current active persona */}
                {currentAgentIdx < 6 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-primary/20 bg-primary/5 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                        {(() => {
                          const persona = AGENT_PERSONAS[currentAgentIdx + 1] || AGENT_PERSONAS[0];
                          const Icon = persona.icon;
                          return <Icon className={`h-5 w-5 ${persona.color}`} />;
                        })()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground/90">
                            {AGENT_PERSONAS[currentAgentIdx + 1]?.name || AGENT_PERSONAS[0].name}
                          </span>
                          <motion.span
                            animate={{ opacity: [1, 0.4, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="text-[9px] font-mono text-primary px-1.5 py-0.5 rounded bg-primary/10"
                          >
                            ACTIVE
                          </motion.span>
                        </div>
                        <p className="text-xs text-primary/60 mt-0.5">
                          {activityLog[currentAgentIdx]?.action || "Initializing..."}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-primary">
                          {getPersonaConfidence(AGENT_PERSONAS[currentAgentIdx + 1]?.id || "commander", currentAgentIdx + 1)}%
                        </div>
                        <p className="text-[9px] text-muted-foreground/40">confidence</p>
                      </div>
                    </div>
                    <div className="mt-3 h-1 w-full rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        animate={{ width: ["0%", "100%"] }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Activity log */}
                {activityLog.map((entry, i) => {
                  const Icon = entry.persona.icon;
                  const isLast = i === activityLog.length - 1;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 }}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${
                        entry.status === "active"
                          ? "border border-primary/20 bg-primary/5"
                          : entry.status === "done"
                          ? "border border-ash-500/10 bg-ash-500/5"
                          : "border border-transparent"
                      }`}
                    >
                      <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                        entry.status === "active" ? "bg-primary/20" : entry.status === "done" ? "bg-ash-500/20" : "bg-white/5"
                      }`}>
                        {entry.status === "done" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-ash-400" />
                        ) : (
                          <Icon className={`h-3.5 w-3.5 ${entry.persona.color}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-medium ${
                            entry.status === "active" ? "text-foreground" : entry.status === "done" ? "text-ash-400/70" : "text-muted-foreground/40"
                          }`}>
                            {entry.persona.name}
                          </span>
                        </div>
                        <p className={`text-[9px] ${
                          entry.status === "active" ? "text-primary/60" : entry.status === "done" ? "text-ash-400/40" : "text-muted-foreground/30"
                        }`}>
                          {entry.status === "active" ? entry.action : entry.status === "done" ? "Completed" : ""}
                        </p>
                      </div>
                      {entry.status === "active" && (
                        <Loader2 className="h-3 w-3 text-primary animate-spin shrink-0" />
                      )}
                      {entry.status === "done" && (
                        <CheckCircle2 className="h-3 w-3 text-ash-400/50 shrink-0" />
                      )}
                    </motion.div>
                  );
                })}

                {/* Empty state */}
                {activityLog.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Bot className="h-8 w-8 text-muted-foreground/20 mb-3" />
                    <p className="text-xs text-muted-foreground/40">Agent activity will appear here</p>
                    <p className="text-[10px] text-muted-foreground/30 mt-1">Start typing a mission to begin</p>
                  </div>
                )}

                {/* Blinking cursor at bottom */}
                {currentAgentIdx < 6 && (
                  <motion.div
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-[10px] text-muted-foreground/30 font-mono px-1"
                  >
                    _
                  </motion.div>
                )}
              </div>

              {/* Bottom bar */}
              <div className="border-t border-white/5 px-4 py-2.5 flex items-center justify-between text-[9px] text-muted-foreground/40 font-mono">
                <span className="flex items-center gap-1">
                  <Cpu className="h-3 w-3" /> agents: {currentAgentIdx}/6
                </span>
                <span>knowledge graph updating</span>
                <span>confidence: {currentAgentIdx > 0 ? 70 + currentAgentIdx * 4 : 0}%</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
