"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import {
  Bot, ArrowRight, Sparkles, Search, Brain, Eye, FileText, CheckCircle2, Loader2,
  Cpu, Target, Clock, BarChart3, Globe, GraduationCap, Award, Star, Zap, Lightbulb,
  Database, Shield, Menu, X, Rocket, Stamp as StampIcon, Briefcase,
  Trophy, TrendingUp, Activity, AlertCircle, Layers,
} from "lucide-react";

const AGENTS = [
  { icon: Bot, name: "Mission Commander", role: "Orchestrator", desc: "Coordinates the entire mission. Assigns work. Tracks progress. Combines results." },
  { icon: GraduationCap, name: "Scholarship Agent", role: "Funding", desc: "Searches scholarship databases. Finds funding opportunities. Extracts deadlines. Analyzes eligibility." },
  { icon: Briefcase, name: "Internship Agent", role: "Placement", desc: "Searches internship opportunities. Matches roles against skills. Evaluates hiring requirements." },
  { icon: Award, name: "Grant Agent", role: "Research", desc: "Discovers grants, research funding, innovation programs, and entrepreneurship support." },
  { icon: Lightbulb, name: "Research Agent", role: "Academic", desc: "Finds conferences, research opportunities, academic programs, and publications." },
  { icon: Trophy, name: "Competition Agent", role: "Innovation", desc: "Discovers hackathons, innovation competitions, startup accelerators, and challenges." },
  { icon: Brain, name: "Evaluation Agent", role: "Analysis", desc: "Analyzes every opportunity. Ranks matches. Explains eligibility. Identifies gaps. Calculates success probability." },
  { icon: FileText, name: "Document Agent", role: "Content", desc: "Generates resumes, CVs, cover letters, personal statements, checklists, and submission timelines." },
  { icon: Globe, name: "Web Agent", role: "Research", desc: "Searches official websites. Verifies information. Collects updated deadlines. Extracts requirements." },
];

const PHASES = [
  { icon: Eye, label: "Perceive", desc: "Understand the mission and available context" },
  { icon: Brain, label: "Reason", desc: "Think step-by-step about goals and constraints" },
  { icon: Target, label: "Plan", desc: "Create a structured execution plan" },
  { icon: Search, label: "Search", desc: "Call tools and search trusted sources" },
  { icon: BarChart3, label: "Evaluate", desc: "Score eligibility, rank matches, analyze gaps" },
  { icon: FileText, label: "Generate", desc: "Create documents, checklists, and timelines" },
  { icon: Database, label: "Remember", desc: "Store findings in persistent memory" },
  { icon: CheckCircle2, label: "Complete", desc: "Deliver mission report with all findings" },
];

function GrainOverlay() {
  return (
    <svg className="pointer-events-none fixed inset-0 z-[1] h-full w-full opacity-[0.025] mix-blend-overlay" aria-hidden="true">
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" /></filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  );
}

function Stamp({ label, tone = "brass", pulse = false }: { label: string; tone?: "brass" | "signal"; pulse?: boolean }) {
  const c = tone === "signal" ? "border-[#3FA78E] text-[#3FA78E]" : "border-[#C9A227] text-[#C9A227]";
  return (
    <motion.span initial={{ scale: 0.85, rotate: -8, opacity: 0 }} animate={{ scale: 1, rotate: -3, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 16 }}
      className={`inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-dashed px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] ${c}`}>
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {label}
    </motion.span>
  );
}

export function LandingClient() {
  const router = useRouter();
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeAgentIdx, setActiveAgentIdx] = useState(0);
  const [demoLog, setDemoLog] = useState<Array<{ name: string; action: string; status: "pending" | "active" | "done" }>>([]);
  const [demoComplete, setDemoComplete] = useState(false);



  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (demoComplete) return;
    const interval = setInterval(() => {
      if (activeAgentIdx < AGENTS.length) {
        setDemoLog(prev => [...prev.map(p => p.status === "active" ? { ...p, status: "done" as const } : p), { name: AGENTS[activeAgentIdx].name, action: AGENTS[activeAgentIdx].desc, status: "active" as const }]);
        setActiveAgentIdx(p => p + 1);
      } else { clearInterval(interval); setDemoComplete(true); }
    }, 1400);
    return () => clearInterval(interval);
  }, [activeAgentIdx, demoComplete]);

  function launchAgent(e?: React.FormEvent) {
    e?.preventDefault();
    if (!goal.trim()) return;
    setLoading(true);
    const sessionId = uuidv4();
    router.push(`/agent/${sessionId}?goal=${encodeURIComponent(goal)}`);
  }

  return (
    <div className="relative min-h-screen bg-[#0B0E13] text-[#F3EEE1] antialiased" style={{ fontFamily: "var(--font-body)" }}>
      <GrainOverlay />
      <div className="pointer-events-none fixed -top-40 right-0 z-0 h-[560px] w-[560px] rounded-full bg-[#C9A227]/[0.06] blur-[140px]" />
      <div className="pointer-events-none fixed -bottom-40 left-0 z-0 h-[400px] w-[400px] rounded-full bg-[#3FA78E]/[0.04] blur-[120px]" />

      {/* NAV */}
      <motion.header initial={{ y: -72 }} animate={{ y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="fixed top-0 z-50 w-full px-4">
        <div className={`mx-auto max-w-7xl transition-all duration-500 ${scrolled ? "mt-2 rounded-sm border border-[#F3EEE1]/10 bg-[#0B0E13]/90 backdrop-blur-md shadow-[0_1px_0_rgba(243,238,225,0.06)]" : "bg-transparent"}`}>
          <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
            <a href="/" className="group flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm border-[1.5px] border-[#C9A227] text-[#C9A227] transition-transform group-hover:-rotate-6">
                <StampIcon className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div className="leading-none">
                <span className="block font-medium tracking-tight text-[#F3EEE1]" style={{ fontFamily: "var(--font-display)" }}>Opportunity AI</span>
                <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.2em] text-[#F3EEE1]/35">Autonomous career agent</span>
              </div>
            </a>
            <nav className="hidden md:flex items-center gap-8">
              {["Problem", "How it works", "Agents", "Features"].map(label => (
                <a key={label} href={`#${label.toLowerCase().replace(/\s+/g, '-')}`}
                  className="relative text-[13px] text-[#F3EEE1]/50 transition-colors hover:text-[#F3EEE1] group">
                  {label}
                  <span className="absolute -bottom-1 left-0 h-px w-0 bg-[#C9A227] transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
            </nav>
            <div className="hidden md:flex items-center gap-3">
              <a href="/mission" className="inline-flex items-center gap-2 rounded-sm bg-[#C9A227] px-5 py-2.5 text-[13px] font-semibold text-[#0B0E13] transition-transform hover:-translate-y-0.5">Start mission <Rocket className="h-3.5 w-3.5" /></a>
            </div>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden flex h-9 w-9 items-center justify-center rounded-sm border border-[#F3EEE1]/10 text-[#F3EEE1]/60">
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
          <AnimatePresence>
            {mobileOpen && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-t border-[#F3EEE1]/10">
                <div className="space-y-1 px-4 py-3">
                  {["Problem", "How it works", "Agents", "Features"].map(label => (
                    <a key={label} href={`#${label.toLowerCase().replace(/\s+/g, '-')}`} onClick={() => setMobileOpen(false)}
                      className="block rounded-sm px-3 py-2 text-[13px] text-[#F3EEE1]/50 hover:bg-[#F3EEE1]/5 hover:text-[#F3EEE1]">{label}</a>
                  ))}
                  <a href="/mission" onClick={() => setMobileOpen(false)} className="mt-2 flex items-center justify-center gap-2 rounded-sm bg-[#C9A227] px-4 py-2.5 text-[13px] font-semibold text-[#0B0E13]">Start mission <ArrowRight className="h-3.5 w-3.5" /></a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      <main className="relative z-10 flex-1">
        {/* HERO */}
        <section className="relative min-h-screen flex items-center pt-24 pb-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 w-full">
            <div className="grid lg:grid-cols-5 gap-10 lg:gap-14 items-start">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="lg:col-span-2 space-y-7 lg:sticky lg:top-28">
                <h1 className="text-[2.6rem] sm:text-5xl lg:text-[3.4rem] font-medium tracking-tight leading-[1.05]" style={{ fontFamily: "var(--font-display)" }}>
                  AI that works while<span className="block italic text-[#C9A227]">you sleep</span>
                  <span className="block text-[#F3EEE1]/40 text-lg sm:text-xl font-normal mt-3" style={{ fontFamily: "var(--font-body)" }}>Autonomous opportunity agent for Africa</span>
                </h1>
                <p className="text-sm sm:text-[15px] text-[#F3EEE1]/45 leading-relaxed max-w-md">Opportunity AI is an <strong className="text-[#F3EEE1]/70">autonomous multi-agent system</strong> powered by Google Gemma 4. Unlike chatbots that wait for instructions, it independently plans, searches, evaluates, and generates applications — exactly like hiring a full-time AI career assistant. Give it a mission, it handles the rest.</p>
                <form onSubmit={launchAgent} className="space-y-3">
                  <label className="block">
                    <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-[#F3EEE1]/35">Mission brief</span>
                    <textarea value={goal} onChange={e => setGoal(e.target.value)} placeholder="Describe your mission — e.g. Find fully funded AI Master's scholarships in Europe..." rows={2}
                      className="w-full resize-none border-0 border-b-[1.5px] border-[#F3EEE1]/15 bg-transparent py-2 text-[15px] text-[#F3EEE1] placeholder:text-[#F3EEE1]/20 focus:border-[#C9A227] focus:outline-none transition-colors" />
                  </label>
                  <button type="submit" disabled={!goal.trim() || loading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-[#C9A227] px-6 py-3.5 text-sm font-semibold text-[#0B0E13] transition-all hover:-translate-y-0.5 disabled:opacity-30 disabled:hover:translate-y-0 disabled:cursor-not-allowed">
                    {loading ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Launching...</span> : <span className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Launch autonomous AI</span>}
                  </button>
                </form>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#F3EEE1]/10 pt-4 font-mono text-[11px] text-[#F3EEE1]/30">
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-[#C9A227]/70" /> 9 specialized agents</span>
                  <span className="flex items-center gap-1.5"><Cpu className="h-3 w-3 text-[#3FA78E]/70" /> 16+ tools</span>
                  <span className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-[#C2703D]/70" /> 3-minute results</span>
                </div>
                <div className="rounded-sm bg-[#C9A227]/[0.04] border border-[#C9A227]/15 px-3 py-2 font-mono text-[11px] text-[#C9A227]/60">
                  <span className="font-semibold">For judges:</span> Pick an example mission → watch the agent reason, search, analyze, and generate documents in real-time. Results appear in under 3 minutes.
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }} className="lg:col-span-3 space-y-4">
                <div className="flex items-center gap-0 overflow-x-auto pb-1 scrollbar-hide">
                  {PHASES.map((phase, i) => {
                    const Icon = phase.icon;
                    const isActive = activeAgentIdx > i;
                    const isDone = activeAgentIdx > i + 1;
                    return (
                      <div key={phase.label} className="flex items-center shrink-0">
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 ${isActive ? "text-[#C9A227]" : isDone ? "text-[#3FA78E]/70" : "text-[#F3EEE1]/25"}`}>
                          <span className="font-mono text-[9px]">{String(i + 1).padStart(2, "0")}</span>
                          <Icon className="h-3 w-3" strokeWidth={1.75} />
                          <span className="text-[11px] font-medium">{phase.label}</span>
                        </div>
                        {i < PHASES.length - 1 && <span className={`h-px w-4 ${isDone ? "bg-[#3FA78E]/40" : "bg-[#F3EEE1]/10"}`} />}
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[#F3EEE1]/10 px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Bot className="h-4 w-4 text-[#C9A227]" strokeWidth={1.75} />
                      <span className="text-[13px] font-medium text-[#F3EEE1]/90" style={{ fontFamily: "var(--font-display)" }}>Mission dossier</span>
                    </div>
                    <Stamp label={demoComplete ? "Complete" : "Processing"} tone={demoComplete ? "signal" : "brass"} pulse={!demoComplete} />
                  </div>
                  <div className="px-5 py-2.5 border-b border-[#F3EEE1]/[0.06] flex items-center gap-2.5">
                    <Target className="h-3.5 w-3.5 text-[#C2703D] shrink-0" strokeWidth={1.75} />
                    <span className="text-[12.5px] text-[#F3EEE1]/50 truncate">Find fully funded AI Master's scholarships in Europe</span>
                    <span className="ml-auto font-mono text-[10px] text-[#F3EEE1]/25 shrink-0">{activeAgentIdx}/{AGENTS.length}</span>
                  </div>
                  <div className="px-2 py-1 min-h-[260px] max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {demoLog.map((entry, i) => {
                      const agent = AGENTS.find(a => a.name === entry.name) || AGENTS[0];
                      const Icon = agent.icon;
                      return (
                        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
                          className="flex items-center gap-3 px-3 py-2.5 border-b border-[#F3EEE1]/[0.05] last:border-0">
                          <span className="w-5 shrink-0 font-mono text-[10px] text-[#F3EEE1]/20">{String(i + 1).padStart(2, "0")}</span>
                          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border ${entry.status === "done" ? "border-[#3FA78E]/30 bg-[#3FA78E]/10" : entry.status === "active" ? "border-[#C9A227]/40 bg-[#C9A227]/10" : "border-[#F3EEE1]/10"}`}>
                            {entry.status === "done" ? <CheckCircle2 className="h-3.5 w-3.5 text-[#3FA78E]" /> : <Icon className="h-3.5 w-3.5 text-[#C9A227]" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[13px] ${entry.status === "active" ? "text-[#F3EEE1]/95" : "text-[#F3EEE1]/55"}`} style={{ fontFamily: "var(--font-display)" }}>{entry.name}</p>
                            {entry.status === "active" && <p className="text-[11px] text-[#F3EEE1]/35 truncate mt-0.5">{entry.action}</p>}
                          </div>
                          <span className={`shrink-0 font-mono text-[9px] uppercase tracking-wider ${entry.status === "done" ? "text-[#3FA78E]/60" : entry.status === "active" ? "text-[#C9A227]" : "text-[#F3EEE1]/25"}`}>
                            {entry.status === "active" ? <Loader2 className="h-3 w-3 animate-spin" /> : entry.status}
                          </span>
                        </motion.div>
                      );
                    })}
                    {demoComplete && (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mx-3 my-3 rounded-sm border border-[#3FA78E]/25 bg-[#3FA78E]/[0.06] p-4">
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <CheckCircle2 className="h-4 w-4 text-[#3FA78E]" />
                          <span className="text-[13px] font-medium text-[#3FA78E]" style={{ fontFamily: "var(--font-display)" }}>Mission complete</span>
                        </div>
                        <p className="text-[12.5px] text-[#F3EEE1]/50">27 opportunities found · 3 top matches · 3 documents generated</p>
                      </motion.div>
                    )}
                    {demoLog.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <Bot className="h-9 w-9 text-[#F3EEE1]/10 mb-3" strokeWidth={1.25} />
                        <p className="text-xs text-[#F3EEE1]/30">Agent team initializing...</p>
                        <p className="text-[11px] text-[#F3EEE1]/20 mt-1">Decomposing mission, allocating sub-agents</p>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-[#F3EEE1]/10 px-5 py-2.5 flex items-center justify-between font-mono text-[10px] text-[#F3EEE1]/30">
                    <span>agents {activeAgentIdx}/{AGENTS.length}</span>
                    <span>confidence {activeAgentIdx > 0 ? Math.min(95, 50 + activeAgentIdx * 4) : 0}%</span>
                    <span>sources {Math.min(27, activeAgentIdx * 3)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {AGENTS.slice(0, 10).map((agent, i) => {
                    const isActive = activeAgentIdx === i + 1;
                    const isDone = activeAgentIdx > i + 1;
                    const Icon = agent.icon;
                    return (
                      <div key={agent.name} className={`rounded-sm border px-2 py-2 text-center transition-colors ${isActive ? "border-[#C9A227]/50 bg-[#C9A227]/[0.08]" : isDone ? "border-[#3FA78E]/25 bg-[#3FA78E]/[0.05]" : "border-[#F3EEE1]/[0.06] opacity-40"}`}>
                        <Icon className={`h-4 w-4 mx-auto mb-1 ${isActive ? "text-[#C9A227]" : isDone ? "text-[#3FA78E]" : "text-[#F3EEE1]/30"}`} />
                        <p className={`font-mono text-[9px] uppercase tracking-wide ${isActive ? "text-[#F3EEE1]/80" : isDone ? "text-[#3FA78E]/60" : "text-[#F3EEE1]/20"}`}>{agent.role}</p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* PROBLEM */}
        <section id="problem" className="relative py-28 border-t border-[#F3EEE1]/[0.06]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-14 items-start">
              <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                <span className="mb-4 inline-block rounded-full border-[1.5px] border-dashed border-[#C2703D]/50 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C2703D] -rotate-1">The problem</span>
                <h2 className="text-4xl sm:text-5xl font-medium tracking-tight mb-4" style={{ fontFamily: "var(--font-display)" }}>Opportunity is <span className="italic text-[#C2703D]">fragmented</span></h2>
                <p className="text-[#F3EEE1]/40 text-sm leading-relaxed mb-6">Every year, millions of talented people — especially across Africa and other developing regions — miss valuable opportunities because the application process is fragmented and overwhelming.</p>
                <div className="space-y-3">
                  {["Search dozens of websites for opportunities","Compare eligibility requirements manually","Track multiple deadlines across time zones","Prepare CVs, cover letters, and statements","Build application checklists from scratch","Remember submission dates and follow-ups"].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-[#F3EEE1]/60"><AlertCircle className="h-4 w-4 text-[#C2703D]/50 shrink-0" strokeWidth={1.75} />{item}</div>
                  ))}
                </div>
                <p className="mt-6 text-sm text-[#F3EEE1]/30 italic">This process takes days or weeks. Most applicants give up or miss deadlines.</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}>
                <span className="mb-4 inline-block rounded-full border-[1.5px] border-dashed border-[#3FA78E]/50 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#3FA78E] -rotate-1">Our solution</span>
                <h2 className="text-4xl sm:text-5xl font-medium tracking-tight mb-4" style={{ fontFamily: "var(--font-display)" }}>One mission. <span className="italic text-[#3FA78E]">Everything handled.</span></h2>
                <p className="text-[#F3EEE1]/40 text-sm leading-relaxed mb-6">Opportunity AI transforms that entire workflow into a single autonomous mission. Instead of a chatbot that waits for instructions, it behaves like an intelligent AI employee — planning, reasoning, collaborating, and executing from start to finish.</p>
                <div className="space-y-3">
                  {["You give one mission statement","9 specialized AI agents collaborate autonomously","16+ tools are dynamically selected and executed","Opportunities are discovered, evaluated, and ranked","Documents are generated automatically","A complete application strategy is delivered"].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-[#F3EEE1]/60"><CheckCircle2 className="h-4 w-4 text-[#3FA78E]/50 shrink-0" strokeWidth={2} />{item}</div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="relative py-28 border-t border-[#F3EEE1]/[0.06]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-16 max-w-2xl">
              <span className="mb-4 inline-block rounded-full border-[1.5px] border-dashed border-[#C9A227]/50 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C9A227] -rotate-1">Eight-step process</span>
              <h2 className="text-4xl sm:text-5xl font-medium tracking-tight mb-4" style={{ fontFamily: "var(--font-display)" }}>How the agent <span className="italic text-[#C9A227]">thinks</span></h2>
              <p className="text-[#F3EEE1]/40 text-sm leading-relaxed">Every decision is transparent, in this order — from perceiving your mission to delivering results.</p>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-[#F3EEE1]/[0.06]">
              {PHASES.map((phase, i) => {
                const Icon = phase.icon;
                return (
                  <motion.div key={phase.label} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.4 }}
                    className="group border-b border-r border-[#F3EEE1]/[0.06] p-6 hover:bg-[#F3EEE1]/[0.02] transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-[#F3EEE1]/10 group-hover:border-[#C9A227]/40 transition-colors"><Icon className="h-4 w-4 text-[#C9A227]" /></div>
                      <span className="font-mono text-[11px] text-[#F3EEE1]/20">{String(i + 1).padStart(2, "0")}</span>
                    </div>
                    <p className="text-sm font-medium text-[#F3EEE1] mb-1.5" style={{ fontFamily: "var(--font-display)" }}>{phase.label}</p>
                    <p className="text-xs text-[#F3EEE1]/40 leading-relaxed">{phase.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ARCHITECTURE & TECHNOLOGY */}
        <section className="relative py-28 border-t border-[#F3EEE1]/[0.06]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-14 max-w-2xl">
              <span className="mb-4 inline-block rounded-full border-[1.5px] border-dashed border-[#C9A227]/50 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C9A227] -rotate-1">Engineering</span>
              <h2 className="text-4xl sm:text-5xl font-medium tracking-tight mb-4" style={{ fontFamily: "var(--font-display)" }}>Architecture & <span className="italic text-[#C9A227]">technology</span></h2>
            </motion.div>

            {/* Badges grid */}
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="flex flex-wrap gap-2 justify-center mb-14">
              {[
                ["Next.js 16", "Server components, App Router, Turbopack"],
                ["TypeScript 5", "Strict mode, zero `any` types"],
                ["Drizzle ORM", "8 PostgreSQL tables, typed queries"],
                ["Gemma 4", "gemma-4-26b-a4b-it:free via OpenRouter + Google AI"],
                ["Tailwind v4", "Utility-first styling, dark theme"],
                ["shadcn/ui", "Radix primitives, Nova components"],
                ["Framer Motion", "Spring animations, staggered reveals"],
                ["SSE Streaming", "Real-time agent reasoning via EventSource"],
                ["pgvector", "Semantic memory with cosine similarity"],
                ["Function Calling", "Native tool selection via LLM"],
                ["Docker", "Multi-stage build + docker-compose"],
                ["5+ Tests", "Tool registry, memory, emitter, planner, embeddings"],
              ].map(([name, desc], i) => (
                <motion.div key={name} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.02 }}
                  className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] px-4 py-2.5 text-center min-w-[100px]">
                  <p className="text-[13px] font-medium text-[#F3EEE1]" style={{ fontFamily: "var(--font-display)" }}>{name}</p>
                  <p className="text-[11px] text-[#F3EEE1]/40 mt-0.5">{desc}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Architecture flow */}
            <div className="grid lg:grid-cols-3 gap-4">
              {[
                { title: "Multi-Agent Coordinator", desc: "9 specialized sub-agents (Scholarship, Grant, Internship, Research, Competition, Web, Evaluation, Career Coach, Document) orchestrated by a Mission Commander. Each agent has its own role, tools, and decision-making logic.", items: ["State machine with validated phase transitions", "Event bus for decoupled communication", "12-iteration max loop with early termination"] },
                { title: "Tool Registry + Function Calling", desc: "8 dynamically registered tools with Zod validation. The agent selects tools via native function calling API — not JSON prompting.", items: ["search_opportunities · web_search · eligibility_analyzer", "opportunity_ranking · gap_analysis · generate_document", "email_reminder · pdf_generator"] },
                { title: "Persistent Memory + Semantic Search", desc: "Three-tier memory (episodic/semantic/procedural) with importance scoring, access tracking, and embedding-based retrieval.", items: ["Google text-embedding-004 for vector embeddings", "128-dim vectors stored in metadata JSONB", "Cosine similarity re-ranking on recall"] },
                { title: "Dual AI Provider Architecture", desc: "Supports both OpenRouter (gemma-4-26b-a4b-it) and direct Google AI API switchable at runtime via AI_PROVIDER env var.", items: ["JSON mode for structured output", "Streaming support via SSE", "Exponential backoff retry logic"] },
                { title: "SSE Real-Time Streaming", desc: "Server-Sent Events stream every agent decision — reasoning, tool selection, execution results, and memory updates — to the UI in real time.", items: ["Phase indicators (perceive/reason/plan/execute)", "Typewriter effect for reasoning text", "Auto-reconnect on disconnect"] },
                { title: "Document Generation", desc: "AI generates application documents — resumes, cover letters, personal statements, checklists — tailored to each opportunity and user profile.", items: ["Markdown output with html2pdf.js", "Structured with user education, skills, experience", "Downloadable mission reports"] },
              ].map((block, i) => (
                <motion.div key={block.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04, duration: 0.4 }}
                  className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] p-5">
                  <h3 className="text-sm font-medium text-[#C9A227] mb-2" style={{ fontFamily: "var(--font-display)" }}>{block.title}</h3>
                  <p className="text-xs text-[#F3EEE1]/50 leading-relaxed mb-3">{block.desc}</p>
                  <ul className="space-y-1.5">
                    {block.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-[12px] text-[#F3EEE1]/40">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[#C9A227]/50" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

            {/* Gemma 4 badge */}
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-10 text-center">
              <a href="https://ai.google.dev/gemma" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[#C9A227]/30 bg-[#C9A227]/5 px-5 py-2 text-xs text-[#C9A227] hover:bg-[#C9A227]/10 transition-colors">
                <Sparkles className="h-3.5 w-3.5" /> Built with <strong>Gemma 4</strong> — AI for Africa Hackathon 2026
              </a>
            </motion.div>
          </div>
        </section>

        {/* AGENTS */}
        <section id="agents" className="relative py-28 border-t border-[#F3EEE1]/[0.06]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-14 max-w-xl">
              <span className="mb-4 inline-block rounded-full border-[1.5px] border-dashed border-[#3FA78E]/50 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#3FA78E] -rotate-1">Multi-agent system</span>
              <h2 className="text-4xl sm:text-5xl font-medium tracking-tight mb-4" style={{ fontFamily: "var(--font-display)" }}>9 specialized <span className="italic text-[#C9A227]">AI agents</span></h2>
              <p className="text-[#F3EEE1]/40 text-sm leading-relaxed">Each with its own role, tools, and decision-making capabilities. They collaborate autonomously to complete your mission.</p>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {AGENTS.map((agent, i) => {
                const Icon = agent.icon;
                return (
                  <motion.div key={agent.name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.03, duration: 0.4 }}
                    className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] p-5 hover:border-[#F3EEE1]/25 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-[#F3EEE1]/10"><Icon className="h-4 w-4 text-[#C9A227]" /></div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#F3EEE1] truncate" style={{ fontFamily: "var(--font-display)" }}>{agent.name}</p>
                        <p className="font-mono text-[9px] uppercase tracking-wide text-[#F3EEE1]/30">{agent.role}</p>
                      </div>
                    </div>
                    <p className="text-[12.5px] text-[#F3EEE1]/40 leading-relaxed">{agent.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="relative py-28 border-t border-[#F3EEE1]/[0.06]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-14 max-w-xl">
              <h2 className="text-4xl sm:text-5xl font-medium tracking-tight mb-4" style={{ fontFamily: "var(--font-display)" }}>Everything you <span className="italic text-[#C9A227]">need</span></h2>
              <p className="text-[#F3EEE1]/40 text-sm leading-relaxed">From intelligent search to document generation, Opportunity AI provides a complete career toolkit.</p>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: Brain, title: "Intelligence Engine", desc: "Every opportunity gets a comprehensive report with match score, success probability, funding details, eligibility, and AI recommendation." },
                { icon: Search, title: "16+ Dynamic Tools", desc: "Scholarship, internship, fellowship, grant search, eligibility analysis, gap analysis — the AI decides which tools to use and when." },
                { icon: FileText, title: "Document Generation", desc: "Professional CVs, personalized cover letters, personal statements, application checklists, and submission timelines — generated automatically." },
                { icon: TrendingUp, title: "Career Advisory", desc: "Identifies missing qualifications and recommends concrete actions: learn Python, build a portfolio, publish research, get certified." },
                { icon: Layers, title: "Mission Control", desc: "Complete transparency into the AI's decision-making. Observe reasoning phases, active agents, tool execution, and confidence scores." },
                { icon: Database, title: "Persistent Memory", desc: "Every search, decision, and document is stored. Each session builds on the last — the agent remembers your history." },
                { icon: BarChart3, title: "Mission Reports", desc: "Comprehensive end-of-mission reports with opportunities discovered, sources searched, documents generated, and next actions." },
                { icon: Clock, title: "Deadline Tracking", desc: "Automatically extracts deadlines and helps you track submission dates, follow-ups, and application status." },
              ].map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <motion.div key={feature.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04, duration: 0.4 }}
                    className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] p-5 hover:border-[#F3EEE1]/25 transition-colors">
                    <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-[#C9A227]/30 bg-[#C9A227]/10 mb-4"><Icon className="h-4 w-4 text-[#C9A227]" /></div>
                    <h3 className="text-sm font-medium text-[#F3EEE1] mb-1.5" style={{ fontFamily: "var(--font-display)" }}>{feature.title}</h3>
                    <p className="text-xs text-[#F3EEE1]/40 leading-relaxed">{feature.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* WHY THIS WINS — Judge-focused differentiators */}
        <section className="relative py-28 border-t border-[#F3EEE1]/[0.06]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-14 max-w-xl">
              <span className="mb-4 inline-block rounded-full border-[1.5px] border-dashed border-[#C9A227]/50 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C9A227] -rotate-1">Best autonomous AI agent</span>
              <h2 className="text-4xl sm:text-5xl font-medium tracking-tight mb-4" style={{ fontFamily: "var(--font-display)" }}>What makes this <span className="italic text-[#C9A227]">different</span></h2>
              <p className="text-[#F3EEE1]/40 text-sm leading-relaxed">Not a chatbot. Not a pipeline. A true autonomous AI agent that plans, reasons, uses tools, remembers, and delivers end-to-end results — entirely on its own.</p>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: Brain, title: "True Autonomy, Not Chat", desc: "This is not a chatbot that waits for your next prompt. Give it a mission and it plans, executes, and completes without further input. It decides which tools to call, when to search, what to analyze, and when it's done." },
                { icon: Layers, title: "9-AGENT Collaboration", desc: "Not one AI — nine specialized sub-agents (Scholarship, Grant, Internship, Research, Web, Evaluation, Career Coach, Document, Application) coordinated by a Mission Commander. They collaborate, hand off results, and build on each other's work." },
                { icon: Cpu, title: "Tool-Using Intelligence", desc: "The agent doesn't just generate text — it uses 8+ real tools including database search, web search via DuckDuckGo, eligibility analysis, skill gap analysis, document generation, email reminders, and PDF creation. Tools are selected dynamically based on mission context." },
                { icon: Database, title: "Persistent Learning Memory", desc: "Three-tier memory system (episodic/semantic/procedural) with importance scoring. The agent remembers past searches, decisions, and results across sessions. Memory is ranked by importance and retrievable by semantic similarity." },
                { icon: Activity, title: "Visible Reasoning, Live", desc: "Every decision is streamed in real-time via Server-Sent Events. Watch the agent reason step-by-step, select tools, execute them, analyze results, and update its memory — all in a live terminal UI with typewriter effect." },
                { icon: FileText, title: "End-to-End Mission Delivery", desc: "From a single mission statement, the agent delivers: discovered opportunities with eligibility analysis, ranked matches with score, personalized AI advice for each, tailored documents (resume, cover letter, checklist), and a complete mission report." },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div key={item.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04, duration: 0.4 }}
                    className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] p-5 hover:border-[#C9A227]/30 transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-[#C9A227]/30 bg-[#C9A227]/10 mb-4"><Icon className="h-5 w-5 text-[#C9A227]" /></div>
                    <h3 className="text-sm font-medium text-[#F3EEE1] mb-2" style={{ fontFamily: "var(--font-display)" }}>{item.title}</h3>
                    <p className="text-xs text-[#F3EEE1]/45 leading-relaxed">{item.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* TARGET USERS */}
        <section className="relative py-28 border-t border-[#F3EEE1]/[0.06]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-14 max-w-xl">
              <h2 className="text-4xl sm:text-5xl font-medium tracking-tight mb-4" style={{ fontFamily: "var(--font-display)" }}>Built for <span className="italic text-[#C9A227]">everyone</span></h2>
              <p className="text-[#F3EEE1]/40 text-sm leading-relaxed">Designed for students, graduates, researchers, professionals, job seekers, entrepreneurs, founders, and career changers worldwide.</p>
            </motion.div>
            <div className="flex flex-wrap gap-2 justify-center">
              {["University Students","Recent Graduates","Researchers","Professionals","Job Seekers","Entrepreneurs","Startup Founders","Career Changers","Scholarship Applicants","Fellowship Applicants","Hackathon Judges 🏆"].map((user, i) => (
                <motion.span key={user} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }}
                  className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] px-3.5 py-2 text-sm text-[#F3EEE1]/60 hover:border-[#C9A227]/30 hover:text-[#F3EEE1]/90 transition-colors">{user}</motion.span>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-28 border-t border-[#F3EEE1]/[0.06]">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full border-[1.5px] border-dashed border-[#C9A227] -rotate-3">
                <StampIcon className="h-6 w-6 text-[#C9A227]" strokeWidth={1.5} />
              </div>
              <h2 className="text-4xl sm:text-5xl font-medium tracking-tight mb-4" style={{ fontFamily: "var(--font-display)" }}>Ready to open your <span className="italic text-[#C9A227]">mission file</span>?</h2>
              <p className="text-[#F3EEE1]/40 max-w-lg mx-auto mb-10 text-sm leading-relaxed">No forms. No interviews. Just a mission. The AI team handles everything else.</p>
              <a href="/mission" className="inline-flex items-center gap-2.5 rounded-sm bg-[#C9A227] px-10 py-4 text-sm font-semibold text-[#0B0E13] transition-transform hover:-translate-y-0.5"><Rocket className="h-4 w-4" /> Start your mission</a>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[#F3EEE1]/[0.06] py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <StampIcon className="h-4 w-4 text-[#C9A227]" strokeWidth={1.75} />
              <span className="text-xs font-medium text-[#F3EEE1]" style={{ fontFamily: "var(--font-display)" }}>Opportunity AI</span>
              <span className="font-mono text-[10px] text-[#F3EEE1]/25 uppercase tracking-wide">Est. 2026 · Powered by Gemma 4</span>
            </div>
            <a href="https://github.com/somod-gif/Opportunity-AI" target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-[#F3EEE1]/25 hover:text-[#C9A227]/70 transition-colors">View on GitHub →</a>
            <p className="font-mono text-[10px] text-[#F3EEE1]/25 text-center uppercase tracking-wide">Built for Build with Gemma: AI for Africa Hackathon 2026 — Best Autonomous AI Agent</p>
          </div>
        </div>
      </footer>
    </div>
  );
}