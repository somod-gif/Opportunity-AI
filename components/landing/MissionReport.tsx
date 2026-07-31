"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2, Search, Wrench, Brain, FileText, Star,
  Clock, Zap, Target, ArrowRight, Cpu, Database, Globe,
  BarChart3, Share2
} from "lucide-react";

interface Stat {
  icon: typeof CheckCircle2;
  label: string;
  value: number;
  suffix: string;
  color: string;
}

const stats: Stat[] = [
  { icon: Search, label: "Sources searched", value: 8, suffix: "", color: "text-ash-400" },
  { icon: Wrench, label: "Tools executed", value: 13, suffix: "", color: "text-silver-400" },
  { icon: Cpu, label: "Iterations", value: 7, suffix: "", color: "text-primary" },
  { icon: Brain, label: "Reasoning steps", value: 48, suffix: "", color: "text-iron-400" },
  { icon: FileText, label: "Documents generated", value: 5, suffix: "", color: "text-ash-400" },
  { icon: Star, label: "Estimated success rate", value: 78, suffix: "%", color: "text-stone-400" },
  { icon: Clock, label: "Time saved", value: 12, suffix: "hrs", color: "text-smoke-400" },
  { icon: Globe, label: "Applications ready", value: 3, suffix: "", color: "text-ash-400" },
];

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [target]);

  return (
    <span>
      {count}
      {suffix}
    </span>
  );
}

export function MissionReport() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-iron-500/2 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-ash-500/20 bg-ash-500/10 px-4 py-1.5 mb-4">
            <BarChart3 className="h-3.5 w-3.5 text-ash-400" />
            <span className="text-sm font-medium text-ash-400">Mission Report</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Mission <span className="text-gradient">Completed</span>
          </h2>
          <p className="text-muted-foreground/60 max-w-xl mx-auto text-sm">
            Every mission produces a comprehensive report with detailed analytics, generated documents, and next steps.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ash-500/20">
                <CheckCircle2 className="h-5 w-5 text-ash-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Mission Completed Successfully</h3>
                <p className="text-[12px] text-muted-foreground/50 font-mono">
                  7 iterations · 12.4s execution time
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-[12px] text-muted-foreground/60 hover:text-foreground hover:border-white/20 transition-all">
                <Share2 className="h-3 w-3" /> Share Report
              </button>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3 }}
                  className="bg-black/60 p-5 text-center"
                >
                  <div className="flex justify-center mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${stat.color}`}>
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="text-[12px] text-muted-foreground/50 mt-1">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Generated docs section */}
          <div className="border-t border-white/5 px-6 py-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-ash-400" />
              <span className="text-sm font-semibold">Generated Documents</span>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { name: "AI-Tailored CV.pdf", size: "24 KB", status: "Ready" },
                { name: "Cover Letter - Mastercard.pdf", size: "18 KB", status: "Ready" },
                { name: "Application Checklist.pdf", size: "12 KB", status: "Ready" },
              ].map((doc) => (
                <div
                  key={doc.name}
                  className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5"
                >
                  <FileText className="h-4 w-4 text-primary/50 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground/70 truncate">{doc.name}</p>
                    <p className="text-[9px] text-muted-foreground/40">{doc.size}</p>
                  </div>
                  <span className="text-[9px] text-ash-400/70">{doc.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="border-t border-white/5 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground/40">
              <Database className="h-3 w-3" />
              All data stored to persistent memory
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary/20 border border-primary/30 px-3 py-1.5 text-[12px] font-medium text-primary hover:bg-primary/30 transition-colors">
              View Full Report <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
