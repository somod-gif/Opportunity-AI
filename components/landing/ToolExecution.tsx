"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Terminal, Search, CheckCircle2, Loader2, ArrowRight, Globe, FileText, Star, Cpu } from "lucide-react";

interface ToolCall {
  name: string;
  status: "pending" | "running" | "done";
  result?: string;
}

const toolCalls: ToolCall[] = [
  { name: "search_scholarships()", status: "pending" },
  { name: "  Searching DAAD...", status: "pending" },
  { name: "  Searching Mastercard Foundation...", status: "pending" },
  { name: "  Searching Opportunity Desk...", status: "pending" },
  { name: "  Searching Google AI...", status: "pending" },
  { name: "  Searching Commonwealth...", status: "pending" },
  { name: "search_grants()", status: "pending" },
  { name: "search_internships()", status: "pending" },
  { name: "analyze_eligibility()", status: "pending" },
  { name: "rank_opportunities()", status: "pending" },
  { name: "generate_resume()", status: "pending" },
  { name: "generate_cover_letter()", status: "pending" },
  { name: "create_mission_report()", status: "pending" },
];

export function ToolExecution() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    if (activeIndex >= toolCalls.length) return;
    const timer = setTimeout(
      () => {
        setCompleted((prev) => [...prev, toolCalls[activeIndex].name]);
        setActiveIndex((p) => p + 1);
      },
      toolCalls[activeIndex].name.startsWith("  ") ? 500 : 900
    );
    return () => clearTimeout(timer);
  }, [activeIndex]);

  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/3 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-ash-500/20 bg-ash-500/10 px-4 py-1.5 mb-4">
            <Terminal className="h-3.5 w-3.5 text-ash-400" />
            <span className="text-xs font-medium text-ash-400">Live Execution</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Live Tool <span className="text-gradient">Execution</span>
          </h2>
          <p className="text-muted-foreground/60 max-w-xl mx-auto text-sm">
            Every tool call streams in real time. The agent dynamically chooses and executes tools based on its reasoning.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl"
        >
          <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl overflow-hidden shadow-2xl">
            {/* Terminal header */}
            <div className="flex items-center gap-3 border-b border-white/5 px-5 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-destructive/60" />
                <div className="h-3 w-3 rounded-full bg-stone-500/60" />
                <div className="h-3 w-3 rounded-full bg-ash-500/60" />
              </div>
              <div className="flex items-center gap-2 mx-auto">
                <Terminal className="h-3.5 w-3.5 text-ash-400/60" />
                <span className="text-[10px] font-mono text-muted-foreground/40">agent@opportunity:~/tools</span>
              </div>
              <div className="flex items-center gap-1.5">
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="h-1.5 w-1.5 rounded-full bg-ash-400"
                />
                <span className="text-[9px] font-mono text-ash-400/60">ACTIVE</span>
              </div>
            </div>

            {/* Terminal body */}
            <div className="px-5 py-4 font-mono text-xs space-y-0.5 min-h-[320px]">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-ash-400/70 mb-3"
              >
                <span className="text-ash-400">$</span> executing mission...
              </motion.div>

              {toolCalls.map((tc, i) => {
                const isDone = completed.includes(tc.name);
                const isActive = activeIndex === i && !isDone;
                const isIndent = tc.name.startsWith("  ");

                return (
                  <motion.div
                    key={tc.name}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{
                      opacity: isDone || isActive ? 1 : 0.15,
                      x: 0,
                    }}
                    transition={{ duration: 0.3 }}
                    className={`flex items-center gap-2 py-0.5 ${isIndent ? "pl-4" : ""}`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-3 w-3 text-ash-400 shrink-0" />
                    ) : isActive ? (
                      <Loader2 className="h-3 w-3 text-primary animate-spin shrink-0" />
                    ) : (
                      <span className="text-muted-foreground/20 h-3 w-3 shrink-0 flex items-center justify-center text-[8px]">&gt;</span>
                    )}

                    <span
                      className={`${
                        isDone
                          ? "text-ash-400/80"
                          : isActive
                          ? "text-primary"
                          : "text-muted-foreground/30"
                      }`}
                    >
                      {tc.name}
                    </span>

                    {isDone && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-ash-400/50"
                      >
                        ✓
                      </motion.span>
                    )}

                    {isActive && (
                      <motion.span
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="text-[9px] text-primary/60 ml-auto font-mono"
                      >
                        executing...
                      </motion.span>
                    )}
                  </motion.div>
                );
              })}

              {activeIndex >= toolCalls.length && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4 pt-3 border-t border-ash-500/20"
                >
                  <div className="flex items-center gap-2 text-ash-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">All tools executed successfully</span>
                  </div>
                  <p className="text-[10px] text-ash-400/50 mt-1">
                    13 tool calls completed in 12.4s · 27 opportunities found
                  </p>
                </motion.div>
              )}
            </div>

            {/* Bottom stats */}
            <div className="border-t border-white/5 px-5 py-2.5 flex items-center gap-4 text-[9px] font-mono text-muted-foreground/30">
              <span className="flex items-center gap-1">
                <Cpu className="h-3 w-3" /> tools: {toolCalls.length}
              </span>
              <span>sources: 8</span>
              <span>results: 27</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
