"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { Fraunces, JetBrains_Mono, Inter } from "next/font/google";
import {
  Bot,
  ArrowRight,
  Sparkles,
  Search,
  Brain,
  Eye,
  FileText,
  CheckCircle2,
  Loader2,
  Cpu,
  Target,
  Clock,
  BarChart3,
  Globe,
  GraduationCap,
  Award,
  Star,
  Zap,
  Lightbulb,
  Database,
  Shield,
  Menu,
  X,
  Rocket,
  Stamp as StampIcon,
} from "lucide-react";
import { AGENT_PERSONAS } from "@/lib/agent/personas";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});
const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

// ---- palette (single source of truth for the arbitrary Tailwind values below) ----
// ink        #0B0E13   base background
// ink-raised #12161D   panels
// paper      #F3EEE1   warm paper accents (used sparingly)
// brass      #C9A227   primary seal / accent
// signal     #3FA78E   "approved" ink-stamp green
// ochre      #C2703D   tertiary, sparing use
// hairline   rgba(243,238,225,0.08)

const EXAMPLES = [
  "Find fully funded AI Master's scholarships in Europe for African students",
  "I need AI/ML internships in Europe for summer 2027",
  "Discover tech fellowships for Kenyan engineering graduates",
  "Find conference funding for renewable energy research in Africa",
  "I need startup grants for women founders in East Africa",
];

const USE_CASES = [
  {
    icon: GraduationCap,
    title: "Medicine",
    desc: "Find medical fellowships",
    tone: "brass" as const,
  },
  {
    icon: Award,
    title: "Engineering",
    desc: "Find research grants",
    tone: "signal" as const,
  },
  {
    icon: Star,
    title: "Technology",
    desc: "Find AI jobs & internships",
    tone: "ochre" as const,
  },
  {
    icon: Zap,
    title: "Business",
    desc: "Find startup funding",
    tone: "brass" as const,
  },
  {
    icon: GraduationCap,
    title: "Education",
    desc: "Find scholarships",
    tone: "signal" as const,
  },
  {
    icon: Shield,
    title: "Law",
    desc: "Find legal fellowships",
    tone: "ochre" as const,
  },
  {
    icon: Globe,
    title: "NGOs",
    desc: "Find humanitarian roles",
    tone: "brass" as const,
  },
  {
    icon: Lightbulb,
    title: "Research",
    desc: "Find research funding",
    tone: "signal" as const,
  },
];

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Use cases", href: "#use-cases" },
  { label: "Architecture", href: "#tech" },
];

const PHASES = [
  {
    icon: Eye,
    label: "Perceive",
    desc: "Understand your goal, education, skills, and context",
  },
  {
    icon: Brain,
    label: "Reason",
    desc: "Think step-by-step about what to search and prioritize",
  },
  {
    icon: Target,
    label: "Plan",
    desc: "Create an action plan with specific next steps",
  },
  {
    icon: Search,
    label: "Search",
    desc: "Search 8+ databases and web sources simultaneously",
  },
  {
    icon: BarChart3,
    label: "Evaluate",
    desc: "Score eligibility, rank matches, analyze gaps",
  },
  {
    icon: FileText,
    label: "Generate",
    desc: "Create resumes, cover letters, checklists, roadmaps",
  },
  {
    icon: Database,
    label: "Remember",
    desc: "Store everything in persistent memory",
  },
  {
    icon: CheckCircle2,
    label: "Complete",
    desc: "Deliver mission report with all findings",
  },
];

const TONE_CLASSES = {
  brass: {
    border: "border-[#C9A227]/40",
    text: "text-[#C9A227]",
    bg: "bg-[#C9A227]/10",
    solid: "bg-[#C9A227]",
  },
  signal: {
    border: "border-[#3FA78E]/40",
    text: "text-[#3FA78E]",
    bg: "bg-[#3FA78E]/10",
    solid: "bg-[#3FA78E]",
  },
  ochre: {
    border: "border-[#C2703D]/40",
    text: "text-[#C2703D]",
    bg: "bg-[#C2703D]/10",
    solid: "bg-[#C2703D]",
  },
};

/** A rotated, dashed-border seal — the page's signature motif, used for status. */
function Stamp({
  label,
  tone = "brass",
  pulse = false,
}: {
  label: string;
  tone?: "brass" | "signal";
  pulse?: boolean;
}) {
  const c =
    tone === "signal"
      ? "border-[#3FA78E] text-[#3FA78E]"
      : "border-[#C9A227] text-[#C9A227]";
  return (
    <motion.span
      initial={{ scale: 0.85, rotate: -8, opacity: 0 }}
      animate={{ scale: 1, rotate: -3, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 16 }}
      className={`inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-dashed px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] ${c}`}
    >
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

function GrainOverlay() {
  return (
    <svg
      className="pointer-events-none fixed inset-0 z-[1] h-full w-full opacity-[0.035] mix-blend-overlay"
      aria-hidden="true"
    >
      <filter id="grain">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.8"
          numOctaves="2"
          stitchTiles="stitch"
        />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  );
}

export function LandingClient() {
  const router = useRouter();
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [demoAgentIdx, setDemoAgentIdx] = useState(0);
  const [demoPhase, setDemoPhase] = useState(0);
  const [demoLog, setDemoLog] = useState<
    Array<{
      name: string;
      action: string;
      status: "pending" | "active" | "done";
    }>
  >([]);
  const [demoComplete, setDemoComplete] = useState(false);

  // A flavor case number — authentic to the "mission" a session already carries, not decorative filler.
  const caseNumber = useMemo(() => {
    const year = new Date().getFullYear();
    const seq = String(Math.floor(Math.random() * 900) + 100);
    return `FILE №${year}-${seq}`;
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-play demo
  useEffect(() => {
    if (demoComplete) return;
    const demoSteps = [
      {
        name: "Mission Commander",
        action: "Decomposing mission into sub-tasks...",
      },
      {
        name: "Scholarship Agent",
        action: "Searching DAAD, Mastercard, Commonwealth databases...",
      },
      {
        name: "Grant Agent",
        action: "Searching grant and fellowship programs...",
      },
      {
        name: "Internship Agent",
        action: "Finding internship opportunities in target region...",
      },
      {
        name: "Research Agent",
        action: "Scanning research programs and conferences...",
      },
      {
        name: "Web Intelligence Agent",
        action: "Scraping official university and program websites...",
      },
      {
        name: "Evaluation Agent",
        action: "Analyzing eligibility requirements for 27 opportunities...",
      },
      {
        name: "Career Coach Agent",
        action: "Recommending skills, courses, and improvements...",
      },
      {
        name: "Document Agent",
        action: "Generating resumes, cover letters, and checklists...",
      },
      {
        name: "Application Agent",
        action: "Preparing submission timeline and tracking...",
      },
    ];

    const interval = setInterval(() => {
      if (demoAgentIdx < demoSteps.length) {
        const step = demoSteps[demoAgentIdx];
        setDemoLog((prev) => [
          ...prev.map((p) =>
            p.status === "active" ? { ...p, status: "done" as const } : p,
          ),
          { name: step.name, action: step.action, status: "active" as const },
        ]);
        setDemoAgentIdx((p) => p + 1);
        setDemoPhase((p) => Math.min(p + 1, PHASES.length - 1));
      } else {
        clearInterval(interval);
        setDemoComplete(true);
      }
    }, 1600);

    return () => clearInterval(interval);
  }, [demoAgentIdx, demoComplete]);

  function launchAgent(e?: React.FormEvent) {
    e?.preventDefault();
    if (!goal.trim()) return;
    setLoading(true);
    const sessionId = uuidv4();
    router.push(`/agent/${sessionId}?goal=${encodeURIComponent(goal)}`);
  }

  return (
    <div
      className={`${display.variable} ${mono.variable} ${body.variable} relative flex min-h-screen flex-col bg-[#0B0E13] text-[#F3EEE1] antialiased`}
      style={{ fontFamily: "var(--font-body)" }}
    >
      <GrainOverlay />
      <div className="pointer-events-none fixed -top-40 right-0 z-0 h-[560px] w-[560px] rounded-full bg-[#C9A227]/[0.06] blur-[140px]" />

      {/* NAV */}
      <motion.header
        initial={{ y: -72 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 z-50 w-full px-4"
      >
        <div
          className={`mx-auto max-w-7xl transition-all duration-500 ${scrolled ? "mt-2 rounded-sm border border-[#F3EEE1]/10 bg-[#0B0E13]/90 backdrop-blur-md shadow-[0_1px_0_rgba(243,238,225,0.06)]" : "bg-transparent"}`}
        >
          <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
            <a href="/" className="group flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm border-[1.5px] border-[#C9A227] text-[#C9A227] transition-transform group-hover:-rotate-6">
                <StampIcon className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div className="leading-none">
                <span
                  className="block font-medium tracking-tight text-[#F3EEE1]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Opportunity AI
                </span>
                <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.2em] text-[#F3EEE1]/35">
                  Autonomous career agent
                </span>
              </div>
            </a>

            <nav className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="relative text-[13px] text-[#F3EEE1]/50 transition-colors hover:text-[#F3EEE1] group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 h-px w-0 bg-[#C9A227] transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <a
                href="/mission"
                className="inline-flex items-center gap-2 rounded-sm bg-[#C9A227] px-5 py-2.5 text-[13px] font-semibold text-[#0B0E13] transition-transform hover:-translate-y-0.5"
              >
                Start mission <Rocket className="h-3.5 w-3.5" />
              </a>
            </div>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-sm border border-[#F3EEE1]/10 text-[#F3EEE1]/60"
            >
              {mobileOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>

          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden border-t border-[#F3EEE1]/10"
              >
                <div className="space-y-1 px-4 py-3">
                  {NAV_LINKS.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-sm px-3 py-2 text-[13px] text-[#F3EEE1]/50 hover:bg-[#F3EEE1]/5 hover:text-[#F3EEE1]"
                    >
                      {link.label}
                    </a>
                  ))}
                  <a
                    href="/mission"
                    onClick={() => setMobileOpen(false)}
                    className="mt-2 flex items-center justify-center gap-2 rounded-sm bg-[#C9A227] px-4 py-2.5 text-[13px] font-semibold text-[#0B0E13]"
                  >
                    Start mission <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      <main className="relative z-10 flex-1">
        {/* HERO */}
        <section className="relative min-h-[calc(100vh-4rem)] flex items-center pt-24 pb-16">
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 w-full">
            <div className="grid lg:grid-cols-5 gap-10 lg:gap-14 items-start">
              {/* LEFT — intake */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="lg:col-span-2 space-y-7 lg:sticky lg:top-28"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-full border-[1.5px] border-dashed border-[#C9A227]/60 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C9A227] -rotate-2 inline-block">
                    {caseNumber} · open
                  </span>
                </div>

                <h1
                  className="text-[2.6rem] sm:text-5xl lg:text-[3.4rem] font-medium tracking-tight leading-[1.05]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Your autonomous
                  <span className="block italic text-[#C9A227]">
                    career agent
                  </span>
                  <span
                    className="block text-[#F3EEE1]/40 text-lg sm:text-xl font-normal mt-3"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    Plan. Reason. Search. Apply. Learn.
                  </span>
                </h1>

                <p className="text-sm sm:text-[15px] text-[#F3EEE1]/45 leading-relaxed max-w-md">
                  Open one mission and an autonomous team of agents finds real
                  opportunities, checks eligibility, and drafts everything you
                  need to apply — scholarships, grants, fellowships, and jobs.
                </p>

                <form onSubmit={launchAgent} className="space-y-3">
                  <label className="block">
                    <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-[#F3EEE1]/35">
                      Mission brief
                    </span>
                    <textarea
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      placeholder="Describe your mission — e.g. I need AI scholarships in Canada..."
                      rows={2}
                      className="w-full resize-none border-0 border-b-[1.5px] border-[#F3EEE1]/15 bg-transparent py-2 text-[15px] text-[#F3EEE1] placeholder:text-[#F3EEE1]/20 focus:border-[#C9A227] focus:outline-none transition-colors"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={!goal.trim() || loading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-[#C9A227] px-6 py-3.5 text-sm font-semibold text-[#0B0E13] transition-all hover:-translate-y-0.5 disabled:opacity-30 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />{" "}
                        Launching...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" /> Launch autonomous AI
                      </span>
                    )}
                  </button>
                </form>

                <div className="space-y-2.5">
                  <p className="font-mono text-[10px] text-[#F3EEE1]/30 uppercase tracking-[0.18em]">
                    Try an example
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {EXAMPLES.map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => setGoal(ex)}
                        className="rounded-sm border border-[#F3EEE1]/10 px-3.5 py-1.5 text-[12.5px] text-[#F3EEE1]/45 hover:border-[#C9A227]/40 hover:text-[#F3EEE1]/85 transition-colors"
                      >
                        {ex.length > 40 ? ex.slice(0, 40) + "..." : ex}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#F3EEE1]/10 pt-4 font-mono text-[11px] text-[#F3EEE1]/30">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-[#C9A227]/70" /> 12
                    specialized agents
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Cpu className="h-3 w-3 text-[#3FA78E]/70" /> 10+ tools
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-[#C2703D]/70" /> No signup
                  </span>
                </div>
              </motion.div>

              {/* RIGHT — dossier */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.7,
                  delay: 0.15,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="lg:col-span-3 space-y-4"
              >
                {/* Pipeline ledger */}
                <div className="flex items-center gap-0 overflow-x-auto pb-1 scrollbar-hide">
                  {PHASES.map((phase, i) => {
                    const Icon = phase.icon;
                    const isActive = demoPhase === i;
                    const isDone = demoPhase > i;
                    return (
                      <div
                        key={phase.label}
                        className="flex items-center shrink-0"
                      >
                        <div
                          className={`flex items-center gap-1.5 px-2.5 py-1 ${isActive ? "text-[#C9A227]" : isDone ? "text-[#3FA78E]/70" : "text-[#F3EEE1]/25"}`}
                        >
                          <span className="font-mono text-[9px]">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <Icon className="h-3 w-3" strokeWidth={1.75} />
                          <span className="text-[11px] font-medium">
                            {phase.label}
                          </span>
                        </div>
                        {i < PHASES.length - 1 && (
                          <span
                            className={`h-px w-4 ${isDone ? "bg-[#3FA78E]/40" : "bg-[#F3EEE1]/10"}`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Dossier panel */}
                <div className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[#F3EEE1]/10 px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Bot
                        className="h-4 w-4 text-[#C9A227]"
                        strokeWidth={1.75}
                      />
                      <span
                        className="text-[13px] font-medium text-[#F3EEE1]/90"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        Mission dossier
                      </span>
                    </div>
                    <Stamp
                      label={demoComplete ? "Complete" : "Processing"}
                      tone={demoComplete ? "signal" : "brass"}
                      pulse={!demoComplete}
                    />
                  </div>

                  <div className="px-5 py-2.5 border-b border-[#F3EEE1]/[0.06] flex items-center gap-2.5">
                    <Target
                      className="h-3.5 w-3.5 text-[#C2703D] shrink-0"
                      strokeWidth={1.75}
                    />
                    <span className="text-[12.5px] text-[#F3EEE1]/50 truncate">
                      Find fully funded AI Master&apos;s scholarships in Europe
                    </span>
                    <span className="ml-auto font-mono text-[10px] text-[#F3EEE1]/25 shrink-0">
                      {demoAgentIdx}/{AGENT_PERSONAS.length}
                    </span>
                  </div>

                  <div className="px-2 py-1 min-h-[260px] max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {demoLog.map((entry, i) => {
                      const persona =
                        AGENT_PERSONAS.find((p) => p.name === entry.name) ||
                        AGENT_PERSONAS[0];
                      const Icon = persona.icon;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3 }}
                          className="flex items-center gap-3 px-3 py-2.5 border-b border-[#F3EEE1]/[0.05] last:border-0"
                        >
                          <span className="w-5 shrink-0 font-mono text-[10px] text-[#F3EEE1]/20">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border ${entry.status === "done" ? "border-[#3FA78E]/30 bg-[#3FA78E]/10" : entry.status === "active" ? "border-[#C9A227]/40 bg-[#C9A227]/10" : "border-[#F3EEE1]/10"}`}
                          >
                            {entry.status === "done" ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-[#3FA78E]" />
                            ) : (
                              <Icon
                                className="h-3.5 w-3.5 text-[#C9A227]"
                                strokeWidth={1.75}
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-[13px] ${entry.status === "active" ? "text-[#F3EEE1]/95" : "text-[#F3EEE1]/55"}`}
                              style={{ fontFamily: "var(--font-display)" }}
                            >
                              {entry.name}
                            </p>
                            {entry.status === "active" && (
                              <p className="text-[11px] text-[#F3EEE1]/35 truncate mt-0.5">
                                {entry.action}
                              </p>
                            )}
                          </div>
                          <span
                            className={`shrink-0 font-mono text-[9px] uppercase tracking-wider ${entry.status === "done" ? "text-[#3FA78E]/60" : entry.status === "active" ? "text-[#C9A227]" : "text-[#F3EEE1]/25"}`}
                          >
                            {entry.status === "active" ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              entry.status
                            )}
                          </span>
                        </motion.div>
                      );
                    })}

                    {demoComplete && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mx-3 my-3 rounded-sm border border-[#3FA78E]/25 bg-[#3FA78E]/[0.06] p-4"
                      >
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <CheckCircle2 className="h-4 w-4 text-[#3FA78E]" />
                          <span
                            className="text-[13px] font-medium text-[#3FA78E]"
                            style={{ fontFamily: "var(--font-display)" }}
                          >
                            Mission complete
                          </span>
                        </div>
                        <p className="text-[12.5px] text-[#F3EEE1]/50">
                          27 opportunities found · 3 top matches · 3 documents
                          generated
                        </p>
                      </motion.div>
                    )}

                    {demoLog.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <Bot
                          className="h-9 w-9 text-[#F3EEE1]/10 mb-3"
                          strokeWidth={1.25}
                        />
                        <p className="text-xs text-[#F3EEE1]/30">
                          Agent team initializing...
                        </p>
                        <p className="text-[11px] text-[#F3EEE1]/20 mt-1">
                          Decomposing mission, allocating sub-agents
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[#F3EEE1]/10 px-5 py-2.5 flex items-center justify-between font-mono text-[10px] text-[#F3EEE1]/30">
                    <span>
                      agents {demoAgentIdx}/{AGENT_PERSONAS.length}
                    </span>
                    <span>
                      confidence{" "}
                      {demoAgentIdx > 0
                        ? Math.min(95, 50 + demoAgentIdx * 4)
                        : 0}
                      %
                    </span>
                    <span>sources {Math.min(27, demoAgentIdx * 3)}</span>
                  </div>
                </div>

                {/* Roster */}
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                  {AGENT_PERSONAS.slice(0, 12).map((persona, i) => {
                    const isActive = demoAgentIdx === i + 1;
                    const isDone = demoAgentIdx > i + 1;
                    const Icon = persona.icon;
                    return (
                      <div
                        key={persona.id}
                        className={`rounded-sm border px-2 py-2 text-center transition-colors ${isActive ? "border-[#C9A227]/50 bg-[#C9A227]/[0.08]" : isDone ? "border-[#3FA78E]/25 bg-[#3FA78E]/[0.05]" : "border-[#F3EEE1]/[0.06] opacity-40"}`}
                      >
                        <Icon
                          className={`h-4 w-4 mx-auto mb-1 ${isActive ? "text-[#C9A227]" : isDone ? "text-[#3FA78E]" : "text-[#F3EEE1]/30"}`}
                          strokeWidth={1.75}
                        />
                        <p
                          className={`font-mono text-[9px] uppercase tracking-wide ${isActive ? "text-[#F3EEE1]/80" : isDone ? "text-[#3FA78E]/60" : "text-[#F3EEE1]/20"}`}
                        >
                          {persona.role}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* HOW IT THINKS */}
        <section
          id="how-it-works"
          className="relative py-28 border-t border-[#F3EEE1]/[0.06]"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-16 max-w-2xl"
            >
              <span className="mb-4 inline-block rounded-full border-[1.5px] border-dashed border-[#C9A227]/50 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C9A227] -rotate-1">
                Eight-step process
              </span>
              <h2
                className="text-4xl sm:text-5xl font-medium tracking-tight mb-4"
                style={{ fontFamily: "var(--font-display)" }}
              >
                How the agent{" "}
                <span className="italic text-[#C9A227]">thinks</span>
              </h2>
              <p className="text-[#F3EEE1]/40 text-sm leading-relaxed">
                Every decision is transparent, in this order — from perceiving
                your mission to delivering results.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-[#F3EEE1]/[0.06]">
              {PHASES.map((phase, i) => {
                const Icon = phase.icon;
                return (
                  <motion.div
                    key={phase.label}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    className="group border-b border-r border-[#F3EEE1]/[0.06] p-6 hover:bg-[#F3EEE1]/[0.02] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-[#F3EEE1]/10 group-hover:border-[#C9A227]/40 transition-colors">
                        <Icon
                          className="h-4 w-4 text-[#C9A227]"
                          strokeWidth={1.75}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-[#F3EEE1]/20">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <p
                      className="text-sm font-medium text-[#F3EEE1] mb-1.5"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {phase.label}
                    </p>
                    <p className="text-xs text-[#F3EEE1]/40 leading-relaxed">
                      {phase.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* USE CASES */}
        <section
          id="use-cases"
          className="relative py-28 border-t border-[#F3EEE1]/[0.06]"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-14 max-w-xl"
            >
              <h2
                className="text-4xl sm:text-5xl font-medium tracking-tight mb-4"
                style={{ fontFamily: "var(--font-display)" }}
              >
                For every{" "}
                <span className="italic text-[#C9A227]">career path</span>
              </h2>
              <p className="text-[#F3EEE1]/40 text-sm leading-relaxed">
                Not just for developers. The agent understands every profession
                — from medicine to law, research to entrepreneurship.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {USE_CASES.map((uc, i) => {
                const Icon = uc.icon;
                const t = TONE_CLASSES[uc.tone];
                return (
                  <motion.button
                    key={uc.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04, duration: 0.4 }}
                    onClick={() =>
                      setGoal(
                        `I am a ${uc.title.toLowerCase()} professional looking to ${uc.desc.toLowerCase()}`,
                      )
                    }
                    className={`group rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] p-6 text-left hover:border-[#F3EEE1]/25 transition-colors`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-sm border ${t.border} ${t.bg} mb-4`}
                    >
                      <Icon
                        className={`h-4 w-4 ${t.text}`}
                        strokeWidth={1.75}
                      />
                    </div>
                    <h3
                      className="text-sm font-medium text-[#F3EEE1] mb-1"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {uc.title}
                    </h3>
                    <p className="text-xs text-[#F3EEE1]/40">{uc.desc}</p>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ARCHITECTURE */}
        <section
          id="tech"
          className="relative py-28 border-t border-[#F3EEE1]/[0.06]"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-14 max-w-xl"
            >
              <span className="mb-4 inline-block rounded-full border-[1.5px] border-dashed border-[#3FA78E]/50 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#3FA78E] -rotate-1">
                Personnel file
              </span>
              <h2
                className="text-4xl sm:text-5xl font-medium tracking-tight mb-4"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Agent{" "}
                <span className="italic text-[#C9A227]">architecture</span>
              </h2>
              <p className="text-[#F3EEE1]/40 text-sm leading-relaxed">
                12 specialized AI agents collaborate autonomously. Each with its
                own role, tools, and decision-making.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {AGENT_PERSONAS.filter(
                (p) =>
                  p.id !== "commander" &&
                  p.id !== "reflection" &&
                  p.id !== "memory",
              ).map((persona, i) => {
                const Icon = persona.icon;
                return (
                  <motion.div
                    key={persona.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.03, duration: 0.4 }}
                    className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] p-5 hover:border-[#F3EEE1]/25 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-[#F3EEE1]/10">
                        <Icon
                          className="h-4 w-4 text-[#C9A227]"
                          strokeWidth={1.75}
                        />
                      </div>
                      <div className="min-w-0">
                        <p
                          className="text-xs font-medium text-[#F3EEE1] truncate"
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          {persona.name}
                        </p>
                        <p className="font-mono text-[9px] uppercase tracking-wide text-[#F3EEE1]/30">
                          {persona.role}
                        </p>
                      </div>
                    </div>
                    <p className="text-[12.5px] text-[#F3EEE1]/40 leading-relaxed line-clamp-2 mb-3">
                      {persona.description}
                    </p>
                    {persona.tools.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 border-t border-[#F3EEE1]/[0.06] pt-3">
                        {persona.tools.slice(0, 3).map((t: string) => (
                          <span
                            key={t}
                            className="rounded-sm border border-[#F3EEE1]/10 px-2 py-0.5 font-mono text-[8.5px] text-[#F3EEE1]/40"
                          >
                            {t}
                          </span>
                        ))}
                        {persona.tools.length > 3 && (
                          <span className="rounded-sm px-2 py-0.5 font-mono text-[8.5px] text-[#F3EEE1]/25">
                            +{persona.tools.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-28 border-t border-[#F3EEE1]/[0.06]">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full border-[1.5px] border-dashed border-[#C9A227] -rotate-3">
                <StampIcon
                  className="h-6 w-6 text-[#C9A227]"
                  strokeWidth={1.5}
                />
              </div>
              <h2
                className="text-4xl sm:text-5xl font-medium tracking-tight mb-4"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Ready to open your{" "}
                <span className="italic text-[#C9A227]">mission file</span>?
              </h2>
              <p className="text-[#F3EEE1]/40 max-w-lg mx-auto mb-10 text-sm leading-relaxed">
                No forms. No interviews. Just a mission. The AI team handles
                everything else.
              </p>
              <a
                href="/mission"
                className="inline-flex items-center gap-2.5 rounded-sm bg-[#C9A227] px-10 py-4 text-sm font-semibold text-[#0B0E13] transition-transform hover:-translate-y-0.5"
              >
                <Rocket className="h-4 w-4" /> Start your mission
              </a>
            </motion.div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-[#F3EEE1]/[0.06] py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <StampIcon
                className="h-4 w-4 text-[#C9A227]"
                strokeWidth={1.75}
              />
              <span
                className="text-xs font-medium text-[#F3EEE1]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Opportunity AI
              </span>
              <span className="font-mono text-[10px] text-[#F3EEE1]/25 uppercase tracking-wide">
                Est. 2026 · Powered by Gemma 4
              </span>
            </div>
            <p className="font-mono text-[10px] text-[#F3EEE1]/25 text-center uppercase tracking-wide">
              Built for Build with Gemma: AI for Africa Hackathon 2026 — Best
              Autonomous AI Agent
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="text-[#F3EEE1]/25 hover:text-[#C9A227] transition-colors"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
              <a
                href="#"
                className="text-[#F3EEE1]/25 hover:text-[#C9A227] transition-colors"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
