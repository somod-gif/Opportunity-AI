"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Search, Brain, FileText, Target, Cpu, Star,
  ArrowDown, CheckCircle2, Loader2, Zap, Globe, Award,
  ListChecks, GraduationCap
} from "lucide-react";

interface Agent {
  name: string;
  icon: typeof Bot;
  color: string;
  gradient: string;
  status: "idle" | "thinking" | "searching" | "scoring" | "writing" | "done";
  tool: string;
  confidence: number;
  decision: string;
}

const agents: Agent[] = [
  { name: "Mission Commander", icon: Bot, color: "text-primary", gradient: "from-primary/20 to-transparent", status: "idle", tool: "Orchestrating", confidence: 98, decision: "Deploying agents" },
  { name: "Scholarship Agent", icon: GraduationCap, color: "text-ash-400", gradient: "from-ash-400/20 to-transparent", status: "idle", tool: "search_scholarships()", confidence: 94, decision: "Found 12 matches" },
  { name: "Grant Agent", icon: Award, color: "text-iron-400", gradient: "from-iron-400/20 to-transparent", status: "idle", tool: "search_grants()", confidence: 89, decision: "Found 7 matches" },
  { name: "Internship Agent", icon: Star, color: "text-silver-400", gradient: "from-silver-400/20 to-transparent", status: "idle", tool: "search_internships()", confidence: 91, decision: "Found 15 matches" },
  { name: "Competition Agent", icon: Zap, color: "text-stone-400", gradient: "from-stone-400/20 to-transparent", status: "idle", tool: "search_competitions()", confidence: 85, decision: "Found 5 matches" },
  { name: "Evaluation Agent", icon: Brain, color: "text-smoke-400", gradient: "from-smoke-400/20 to-transparent", status: "idle", tool: "analyze_eligibility()", confidence: 96, decision: "Scoring top picks" },
  { name: "Application Agent", icon: FileText, color: "text-ash-400", gradient: "from-ash-400/20 to-transparent", status: "idle", tool: "generate_documents()", confidence: 93, decision: "Writing documents" },
];

const statusCycle: Array<Agent["status"]> = ["thinking", "searching", "scoring", "writing", "done"];

export function AgentCollaboration() {
  const [activeAgent, setActiveAgent] = useState(0);
  const [agentStatuses, setAgentStatuses] = useState<Agent["status"][]>(agents.map(() => "idle"));
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhase((p) => {
        const next = p + 1;
        setActiveAgent(next % agents.length);
        setAgentStatuses((prev) => {
          const copy = [...prev] as Agent["status"][];
          copy[next % agents.length] = statusCycle[next % statusCycle.length];
          if (next > 0) copy[(next - 1) % agents.length] = "done";
          return copy;
        });
        return next;
      });
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="agents" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/3 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 mb-4">
            <Bot className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-medium text-primary">Multi-Agent System</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            AI Agent{" "}
            <span className="text-gradient">Collaboration</span>
          </h2>
          <p className="text-muted-foreground/60 max-w-xl mx-auto text-sm">
            Seven specialized AI agents work together autonomously — each with their own tools,
            reasoning, and expertise. Watch them coordinate in real time.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connecting lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            {agents.slice(0, -1).map((_, i) => (
              <motion.line
                key={i}
                x1="50%"
                y1={`${(i + 0.5) * (100 / agents.length)}%`}
                x2="50%"
                y2={`${(i + 1.5) * (100 / agents.length)}%`}
                stroke="url(#lineGradient)"
                strokeWidth="1"
                strokeDasharray="4 4"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: i * 0.2 }}
              />
            ))}
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(139,92,246)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="rgb(59,130,246)" stopOpacity="0.4" />
              </linearGradient>
            </defs>
          </svg>

          <div className="relative space-y-3 z-10">
            {agents.map((agent, i) => {
              const Icon = agent.icon;
              const status = agentStatuses[i] || "idle";
              const isActive = i === activeAgent;

              return (
                <motion.div
                  key={agent.name}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className={`relative rounded-xl border transition-all duration-500 ${
                    isActive
                      ? "border-primary/30 bg-gradient-to-r shadow-lg shadow-primary/10"
                      : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
                  } ${agent.gradient}`}
                >
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div
                      className={`relative flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
                        isActive ? "bg-primary/20" : status === "done" ? "bg-ash-500/20" : "bg-white/5"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? agent.color : status === "done" ? "text-ash-400" : "text-muted-foreground/30"}`} />
                      {isActive && (
                        <motion.div
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-primary shadow-lg shadow-primary/50"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground/90">{agent.name}</span>
                          {isActive && (
                            <span className="text-[12px] font-mono text-primary animate-pulse">ACTIVE</span>
                          )}
                        </div>
                        <p className={`text-sm mt-0.5 ${
                          isActive ? "text-primary/60" : status === "done" ? "text-ash-400/50" : "text-muted-foreground/40"
                        }`}>
                          {agent.tool}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Cpu className={`h-3 w-3 ${isActive ? "text-primary/50" : "text-muted-foreground/30"}`} />
                        <div className="flex-1 max-w-[80px] h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
                            initial={{ width: "0%" }}
                            animate={{ width: isActive ? `${agent.confidence}%` : status === "done" ? "100%" : "0%" }}
                            transition={{ duration: 1, delay: 0.3 }}
                          />
                        </div>
                        <span className="text-[12px] font-mono text-muted-foreground/40">{agent.confidence}%</span>
                      </div>

                      <div className="text-sm text-muted-foreground/50 truncate">
                        {isActive && status !== "done" ? (
                          <span className="flex items-center gap-1.5 text-primary/60">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {agent.decision}
                          </span>
                        ) : status === "done" ? (
                          <span className="flex items-center gap-1.5 text-ash-400/60">
                            <CheckCircle2 className="h-3 w-3" />
                            Ready
                          </span>
                        ) : (
                          agent.decision
                        )}
                      </div>

                      <div className="hidden sm:flex items-center justify-end">
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3].map((s) => (
                            <motion.div
                              key={s}
                              className={`h-1.5 w-1.5 rounded-full ${
                                isActive ? "bg-primary" : "bg-white/10"
                              }`}
                              animate={{ opacity: isActive ? [0.3, 1, 0.3] : 0.3 }}
                              transition={{ duration: 1.5, repeat: Infinity, delay: s * 0.2 }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
