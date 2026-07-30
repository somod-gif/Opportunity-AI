"use client";

import { motion } from "framer-motion";
import { Eye, Brain, Target, Cpu, Search, Database, CheckCircle2, XCircle, type LucideIcon } from "lucide-react";
import type { AgentPhase } from "@/lib/types";

interface PhaseStep {
  phase: AgentPhase;
  icon: LucideIcon;
  label: string;
  color: string;
}

const phases: PhaseStep[] = [
  { phase: "perceive", icon: Eye, label: "Perceive", color: "text-purple-400" },
  { phase: "reason", icon: Brain, label: "Reason", color: "text-violet-400" },
  { phase: "plan", icon: Target, label: "Plan", color: "text-blue-400" },
  { phase: "tool_select", icon: Cpu, label: "Select", color: "text-cyan-400" },
  { phase: "tool_execute", icon: Search, label: "Execute", color: "text-emerald-400" },
  { phase: "observe", icon: Eye, label: "Observe", color: "text-amber-400" },
  { phase: "reflect", icon: Brain, label: "Reflect", color: "text-indigo-400" },
  { phase: "memory", icon: Database, label: "Memory", color: "text-purple-400" },
];

export function PhaseVisualizer({
  currentPhase,
  iteration,
}: {
  currentPhase: AgentPhase;
  iteration: number;
}) {
  const activeIndex = phases.findIndex((p) => p.phase === currentPhase);

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Agent Loop</h3>
        <span className="ml-auto text-[10px] text-muted-foreground/50 font-mono">Iteration {iteration}</span>
      </div>
      <div className="relative">
        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-white/5 mb-6 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary via-violet-500 to-purple-500"
            initial={{ width: "0%" }}
            animate={{
              width: `${activeIndex >= 0 ? ((activeIndex + 1) / phases.length) * 100 : 0}%`,
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* Phase steps */}
        <div className="grid grid-cols-4 gap-2">
          {phases.map((phase, i) => {
            const isActive = i === activeIndex;
            const isPast = i < activeIndex;
            const PhaseIcon = phase.icon;

            return (
              <motion.div
                key={phase.phase}
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: isActive ? [1, 1.05, 1] : 1,
                }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className={`flex flex-col items-center gap-1.5 rounded-lg p-2 transition-all ${
                  isActive
                    ? "bg-primary/10 border border-primary/20"
                    : isPast
                    ? "bg-purple-500/5 border border-purple-500/10"
                    : "bg-white/[0.02] border border-white/5"
                }`}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full ${
                    isActive
                      ? "bg-primary/20"
                      : isPast
                      ? "bg-purple-500/20"
                      : "bg-white/5"
                  }`}
                >
                  {isPast ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-purple-400" />
                  ) : (
                    <PhaseIcon
                      className={`h-3.5 w-3.5 ${
                        isActive ? phase.color : "text-muted-foreground/30"
                      }`}
                    />
                  )}
                </div>
                <span
                  className={`text-[9px] font-medium text-center leading-tight ${
                    isActive
                      ? "text-foreground"
                      : isPast
                      ? "text-purple-400/60"
                      : "text-muted-foreground/30"
                  }`}
                >
                  {phase.label}
                </span>
                {isActive && (
                  <motion.div
                    className="w-1 h-1 rounded-full bg-primary"
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
