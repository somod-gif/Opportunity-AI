"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Brain, Target, Wrench, Search, Database, Star, FileText, ListChecks, CheckCircle2,
  ArrowDown, Sparkles, MessageSquare, GraduationCap, Eye, Cpu, Globe
} from "lucide-react";

interface ThinkingStep {
  icon: typeof Brain;
  label: string;
  description: string;
  color: string;
}

const steps: ThinkingStep[] = [
  { icon: MessageSquare, label: "User submits mission", description: "I am a Nigerian CS student looking for AI scholarships in Canada", color: "text-primary" },
  { icon: Brain, label: "Gemma reasons", description: "Breaking down the mission — education, skills, country, goals", color: "text-iron-400" },
  { icon: Target, label: "Plans execution", description: "Search strategy: scholarships, eligibility, rankings, documents", color: "text-stone-400" },
  { icon: Wrench, label: "Chooses tools", description: "search_scholarships → analyze_eligibility → rank → generate", color: "text-silver-400" },
  { icon: Search, label: "Searches web", description: "DAAD, Mastercard, Google AI, Commonwealth — 8 sources scanned", color: "text-ash-400" },
  { icon: Database, label: "Stores memory", description: "Saving search results, decisions, user preferences to memory", color: "text-charcoal-400" },
  { icon: Star, label: "Ranks opportunities", description: "Match score, eligibility, deadline urgency, competitiveness", color: "text-stone-400" },
  { icon: Eye, label: "Generates roadmap", description: "Personalized action plan with deadlines and milestones", color: "text-smoke-400" },
  { icon: GraduationCap, label: "Creates CV", description: "Tailored resume matching each opportunity's requirements", color: "text-ash-400" },
  { icon: FileText, label: "Writes Cover Letter", description: "AI-generated cover letters for each application", color: "text-ash-400" },
  { icon: ListChecks, label: "Builds Checklist", description: "Required documents, deadlines, submission steps", color: "text-primary" },
  { icon: CheckCircle2, label: "Mission Complete", description: "All opportunities identified, documents ready, reminders set", color: "text-ash-400" },
];

export function AgentThinking() {
  const [activeStep, setActiveStep] = useState(0);
  const [tokens, setTokens] = useState(0);

  useEffect(() => {
    setTokens(Math.floor(128 + Math.random() * 256));
    const timer = setInterval(() => {
      setActiveStep((p) => (p + 1) % steps.length);
      setTokens(Math.floor(128 + Math.random() * 256));
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="how-it-works" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-iron-500/3 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-iron-500/20 bg-iron-500/10 px-4 py-1.5 mb-4">
            <Brain className="h-3.5 w-3.5 text-iron-400" />
            <span className="text-sm font-medium text-iron-400">Agent Reasoning</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            How the Agent <span className="text-gradient">Thinks</span>
          </h2>
          <p className="text-muted-foreground/60 max-w-xl mx-auto text-sm">
            Every decision is transparent. Watch the agent plan, reason, execute, and learn — step by step.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Timeline */}
          <div className="relative space-y-0">
            <div className="absolute left-[23px] top-2 bottom-2 w-px bg-gradient-to-b from-primary via-iron-500 to-ash-500 opacity-30" />

            {steps.map((step, i) => {
              const Icon = step.icon;
              const isActive = activeStep === i;
              const isPast = activeStep > i;

              return (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className={`relative flex items-start gap-5 py-3 px-4 rounded-xl transition-all duration-500 ${
                    isActive ? "bg-primary/10 border border-primary/20" : isPast ? "bg-white/[0.02] border border-white/5" : "border border-transparent"
                  }`}
                >
                  <div
                    className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all ${
                      isActive
                        ? "bg-primary/20 shadow-lg shadow-primary/20"
                        : isPast
                        ? "bg-ash-500/20"
                        : "bg-white/5"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? step.color : isPast ? "text-ash-400" : "text-muted-foreground/30"}`} />
                    {isActive && (
                      <motion.div
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 rounded-xl border border-primary/30"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${isActive ? "text-foreground" : isPast ? "text-ash-400/70" : "text-muted-foreground/40"}`}>
                        {step.label}
                      </span>
                      {isActive && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-primary/20 text-primary">
                          NOW
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mt-0.5 ${isActive ? "text-primary/60" : isPast ? "text-ash-400/40" : "text-muted-foreground/30"}`}>
                      {step.description}
                    </p>
                  </div>

                  {i < steps.length - 1 && (
                    <motion.div
                      animate={{ y: isActive ? [0, 4, 0] : 0 }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute -bottom-2 left-[31px]"
                    >
                      <ArrowDown className="h-3 w-3 text-primary/40" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Live reasoning panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="sticky top-24"
          >
            <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden shadow-2xl">
              <div className="flex items-center gap-2 border-b border-white/5 px-5 py-3">
                <Brain className="h-4 w-4 text-iron-400" />
                <span className="text-sm font-semibold">Current Reasoning</span>
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-[12px] font-mono text-iron-400/60 ml-auto"
                >
                  THINKING
                </motion.span>
              </div>
              <div className="px-5 py-5 space-y-4">
                <AnimatedReasoning step={activeStep} />

                <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-3.5 w-3.5 text-stone-400" />
                    <span className="text-[12px] font-semibold text-stone-400/70">PLAN</span>
                  </div>
                  <p className="text-sm text-muted-foreground/60 leading-relaxed">
                    {activeStep < 3
                      ? "Initializing mission parameters. Defining search scope and success criteria..."
                      : activeStep < 6
                      ? `Executing search across ${8 + activeStep} databases. Filtering by region, field, and deadline...`
                      : activeStep < 9
                      ? "Analyzing results with eligibility scoring. Ranking by match probability..."
                      : "Generating application documents. Preparing submission checklist and reminders..."}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-[12px] text-muted-foreground/30 font-mono">
                  <span>Step {activeStep + 1}/{steps.length}</span>
                  <span className="h-3 w-px bg-white/10" />
                  <span>Reasoning tokens: {tokens}</span>
                  <span className="h-3 w-px bg-white/10" />
                  <span>Confidence: {Math.min(100, 40 + activeStep * 5)}%</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function AnimatedReasoning({ step: _step }: { step: number }) {
  const [text, setText] = useState("");

  const reasoning = [
    `"User mission received. Parsing: country=Nigeria, field=CS/AI, goal=scholarships in Canada. Setting up agent pipeline..."`,
    `"Mission context loaded. Key constraints: fully-funded, AI/ML focus, Canadian universities. Planning search strategy..."`,
    `"Search plan ready: 1️⃣ scholarship databases 2️⃣ university pages 3️⃣ AI-specific programs. Assigning to agents..."`,
    `"Allocating tools: search_scholarships() for DAAD/Mastercard, web_search for university programs, eligibility_analyzer for filtering..."`,
    `"Searching DAAD database... Searching Mastercard portal... Searching Commonwealth... Processing 8 sources simultaneously..."`,
    `"Results stored to episodic memory. Tagging by relevance score, deadline, region. Updating knowledge graph..."`,
    `"Ranking 27 opportunities by: skills match (0.4), deadline urgency (0.2), competitiveness (0.2), location (0.2). Top 3 selected..."`,
    `"Generating personalized roadmap: 1️⃣ Apply to Mastercard by Apr 15 2️⃣ Prepare DAAD docs by May 1 3️⃣ Submit Commonwealth by Jun 1"`,
    `"Generating tailored CV: highlighting ML projects, research experience, academic achievements matching each scholarship criteria..."`,
    `"Writing cover letters: 3 versions generated. Each emphasizing different strengths based on opportunity requirements..."`,
    `"Checklist compiled: 12 documents needed across 3 applications. Deadlines added to reminder system..."`,
    `"🎯 Mission complete! 27 opportunities found, 3 top matches selected, 3 cover letters written, CV tailored, roadmap ready."`,
  ];

  useEffect(() => {
    setText("");
    const full = reasoning[_step] || "";
    let i = 0;
    const interval = setInterval(() => {
      if (i < full.length) {
        setText(full.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 12);
    return () => clearInterval(interval);
  }, [_step]);

  return (
    <p className="text-sm text-iron-300/80 font-mono leading-relaxed min-h-[48px]">
      &gt; {text}
      <span className="typing-cursor inline-block w-[2px] h-3.5 bg-iron-400 ml-0.5 align-middle" />
    </p>
  );
}
