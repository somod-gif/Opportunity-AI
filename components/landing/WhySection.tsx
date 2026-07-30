"use client";

import { motion } from "framer-motion";
import {
  Search, Globe, FileText, XCircle, CheckCircle2,
  Bot, Brain, Wrench, Users, Sparkles, Clock,
  BarChart3, Bell
} from "lucide-react";

interface Comparison {
  traditional: string;
  ai: string;
  icon: typeof Bot;
  color: string;
}

const comparisons: Comparison[] = [
  { icon: Search, color: "text-primary", traditional: "Manual search across websites", ai: "Autonomous planning & execution" },
  { icon: Globe, color: "text-ash-400", traditional: "Multiple websites, tabs, bookmarks", ai: "AI reasoning across all sources" },
  { icon: Wrench, color: "text-silver-400", traditional: "No automation — everything manual", ai: "Tool calling — 20+ dynamic tools" },
  { icon: Users, color: "text-iron-400", traditional: "Single person working alone", ai: "Multi-agent collaboration (7 agents)" },
  { icon: FileText, color: "text-ash-400", traditional: "Manual applications, copy-paste", ai: "Application generation (CV, cover letter, checklist)" },
  { icon: Brain, color: "text-stone-400", traditional: "No reasoning — just search", ai: "Full reasoning: think, plan, execute, reflect" },
  { icon: BarChart3, color: "text-smoke-400", traditional: "No reports or analytics", ai: "Mission reports with detailed analytics" },
  { icon: Bell, color: "text-charcoal-400", traditional: "Missed deadlines, forgotten apps", ai: "Deadline monitoring & reminders" },
];

export function WhySection() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/2 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 mb-4">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Why Opportunity AI</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Traditional Search vs.{" "}
            <span className="text-gradient">Autonomous AI</span>
          </h2>
          <p className="text-muted-foreground/60 max-w-xl mx-auto text-sm">
            Stop manually searching across dozens of websites. Let AI do the work.
          </p>
        </motion.div>

        <div className="mx-auto max-w-4xl">
          {/* Column headers */}
          <div className="grid grid-cols-3 gap-4 mb-6 px-4">
            <div />
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2">
                <XCircle className="h-4 w-4 text-destructive/60" />
                <span className="text-xs font-medium text-destructive/60">Traditional</span>
              </div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 py-2">
                <Bot className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-primary">Opportunity AI</span>
              </div>
            </div>
          </div>

          {/* Rows */}
          <div className="space-y-2">
            {comparisons.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.traditional}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="grid grid-cols-3 gap-4 items-center rounded-xl px-4 py-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                      <Icon className={`h-4 w-4 ${item.color}`} />
                    </div>
                    <span className="text-xs text-muted-foreground/60 font-medium">{item.traditional.split(" ")[0]}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <XCircle className="h-3.5 w-3.5 text-destructive/40 shrink-0" />
                    <span className="text-[11px] text-destructive/50 text-center">{item.traditional}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <CheckCircle2 className="h-3.5 w-3.5 text-ash-400 shrink-0" />
                    <span className="text-[11px] text-ash-400/80 text-center">{item.ai}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-3 rounded-2xl border border-primary/10 bg-primary/5 px-8 py-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <p className="text-sm text-foreground/70">
              <span className="font-semibold text-foreground">Average time saved:</span> 12+ hours per mission
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
