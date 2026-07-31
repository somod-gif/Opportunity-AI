"use client";

import { motion } from "framer-motion";
import {
  Bot, Globe, Cpu, Database, Zap, Cloud, Search, BarChart3,
  Radio, Workflow, Sparkles, Layers
} from "lucide-react";

interface Tech {
  icon: typeof Bot;
  name: string;
  description: string;
  color: string;
  bg: string;
}

const technologies: Tech[] = [
  { icon: Bot, name: "Gemma 4", description: "Google's most capable open model — powers all agent reasoning and decision-making", color: "text-primary", bg: "from-primary/20 to-transparent" },
  { icon: Globe, name: "Next.js 16", description: "App Router, server components, streaming SSR for real-time agent UI", color: "text-foreground", bg: "from-white/10 to-transparent" },
  { icon: Cpu, name: "TypeScript", description: "Strict mode across all agents, tools, prompts, and state machines", color: "text-ash-400", bg: "from-ash-400/20 to-transparent" },
  { icon: Database, name: "PostgreSQL + Neon", description: "Serverless Postgres — persistent memory, mission state, application tracking", color: "text-silver-400", bg: "from-silver-400/20 to-transparent" },
  { icon: Layers, name: "Drizzle ORM", description: "Type-safe database access for agent memory, missions, and user data", color: "text-ash-400", bg: "from-ash-400/20 to-transparent" },
  { icon: Search, name: "Gemini Grounding", description: "Real-time web search with grounded responses for opportunity discovery", color: "text-iron-400", bg: "from-iron-400/20 to-transparent" },
  { icon: Radio, name: "SSE Streaming", description: "Server-Sent Events pipe agent thoughts, tool calls, and decisions to UI", color: "text-smoke-400", bg: "from-smoke-400/20 to-transparent" },
  { icon: Zap, name: "Framer Motion", description: "Premium animations — agent status, knowledge graph, live counters, streaming text", color: "text-stone-400", bg: "from-stone-400/20 to-transparent" },
  { icon: Workflow, name: "Multi-Agent System", description: "7 specialized agents collaborate: Commander, Scholarship, Grant, Internship, Competition, Evaluation, Application", color: "text-ash-400", bg: "from-ash-400/20 to-transparent" },
  { icon: Sparkles, name: "Tool Registry", description: "20+ dynamic tools — search, analyze, rank, generate, notify — chosen by the agent at runtime", color: "text-primary", bg: "from-primary/20 to-transparent" },
  { icon: Cloud, name: "Vercel AI SDK", description: "Streaming, tool calling, structured output for reliable agent execution", color: "text-foreground", bg: "from-white/10 to-transparent" },
  { icon: BarChart3, name: "Recharts", description: "Mission analytics dashboard with phase distribution, tool usage, and performance trends", color: "text-ash-400", bg: "from-ash-400/20 to-transparent" },
];

export function TechStack() {
  return (
    <section id="tech" className="relative py-32 overflow-hidden">
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
            <Cpu className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-medium text-primary">Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Built with Modern <span className="text-gradient">AI Stack</span>
          </h2>
          <p className="text-muted-foreground/60 max-w-xl mx-auto text-sm">
            Every component chosen for reliability, performance, and developer experience.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {technologies.map((tech, i) => {
            const Icon = tech.icon;
            return (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                whileHover={{ y: -2 }}
                className={`group rounded-xl border border-white/5 bg-gradient-to-b ${tech.bg} p-4 hover:border-white/15 hover:shadow-lg transition-all`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white/5`}>
                    <Icon className={`h-4 w-4 ${tech.color}`} />
                  </div>
                  <span className="text-sm font-semibold text-foreground/80">{tech.name}</span>
                </div>
                <p className="text-[12px] text-muted-foreground/50 leading-relaxed">
                  {tech.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-8 text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
            <Zap className="h-3 w-3 text-stone-400" />
            <span className="text-[12px] text-muted-foreground/50">
              Full tech stack —
              <span className="text-foreground/60"> 12 core technologies • 20+ tools • 7 agents • 8 database tables</span>
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
