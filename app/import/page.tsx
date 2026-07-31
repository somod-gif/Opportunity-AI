"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import { getDeviceId } from "@/lib/utils";
import { Fraunces, JetBrains_Mono, Inter } from "next/font/google";
import {
  Bot,
  Link2,
  FileText,
  ArrowRight,
  Rocket,
  Target,
  CheckCircle2,
  Loader2,
  Plus,
  X,
  Sparkles,
  Stamp as StampIcon,
  ClipboardPaste,
} from "lucide-react";

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

const EXAMPLE_LINKS = [
  "https://mastercardfdn.org/en/what-we-do/our-programs/mastercard-foundation-scholars-program/",
  "https://www.daad.de/en/study-and-research-in-germany/scholarships/",
  "https://www.ethz.ch/en/the-eth-zurich/working-teaching-and-research/working-at-eth-zurich.html",
  "https://www.agu.org/learn-about-agu/about-agu",
];

export default function ImportPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"url" | "text">("url");
  const [education, setEducation] = useState("");
  const [country, setCountry] = useState("");
  const [careerGoal, setCareerGoal] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState("");
  const [email, setEmail] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function addSkill() {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
      setSkillInput("");
    }
  }

  function removeSkill(skill: string) {
    setSkills(skills.filter((s) => s !== skill));
  }

  function launch() {
    const hasContent = mode === "url" ? url.trim() : text.trim();
    if (!hasContent) return;
    setLoading(true);
    const sessionId = uuidv4();
    const params = new URLSearchParams({ deviceId: getDeviceId() });
    if (mode === "url") params.set("url", url.trim());
    if (text.trim()) params.set("text", text.trim());
    if (education.trim()) params.set("education", education.trim());
    if (skills.length > 0) params.set("skills", skills.join(","));
    if (country.trim()) params.set("country", country.trim());
    if (careerGoal.trim()) params.set("careerGoal", careerGoal.trim());
    if (experienceLevel) params.set("experienceLevel", experienceLevel);
    if (email.trim()) params.set("email", email.trim());
    router.push(`/import/${sessionId}?${params.toString()}`);
  }

  return (
    <div
      className={`${display.variable} ${mono.variable} ${body.variable} relative min-h-screen bg-[#0B0E13] text-[#F3EEE1] antialiased`}
      style={{ fontFamily: "var(--font-body)" }}
    >
      <svg className="pointer-events-none fixed inset-0 z-[1] h-full w-full opacity-[0.035] mix-blend-overlay" aria-hidden="true">
        <filter id="grain-import">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-import)" />
      </svg>
      <div className="pointer-events-none fixed -top-40 right-0 z-0 h-[560px] w-[560px] rounded-full bg-[#C9A227]/[0.06] blur-[140px]" />
      <div className="pointer-events-none fixed -bottom-40 left-0 z-0 h-[400px] w-[400px] rounded-full bg-[#3FA78E]/[0.04] blur-[120px]" />

      {/* NAV */}
      <motion.header initial={{ y: -72 }} animate={{ y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="fixed top-0 z-50 w-full px-2 sm:px-4">
        <div className={`mx-auto max-w-7xl mt-2 transition-all duration-500 ${scrolled ? "rounded-sm border border-[#F3EEE1]/10 bg-[#0B0E13]/90 backdrop-blur-md shadow-[0_1px_0_rgba(243,238,225,0.06)]" : "bg-transparent"}`}>
          <div className="mx-auto flex h-12 sm:h-14 items-center justify-between px-3 sm:px-6">
            <a href="/" className="group flex items-center gap-2 sm:gap-3">
              <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-sm border-[1.5px] border-[#C9A227] text-[#C9A227] transition-transform group-hover:-rotate-6">
                <StampIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </div>
              <div className="leading-none">
                <span className="block text-sm font-medium tracking-tight text-[#F3EEE1]" style={{ fontFamily: "var(--font-display)" }}>
                  Opportunity AI
                </span>
                <span className="mt-0.5 hidden sm:block font-mono text-sm uppercase tracking-[0.2em] text-[#F3EEE1]/35">
                  Import intake
                </span>
              </div>
            </a>
            <a href="/mission" className="inline-flex items-center gap-1.5 rounded-sm border border-[#F3EEE1]/15 px-3 py-1.5 text-[13px] text-[#F3EEE1]/60 hover:text-[#F3EEE1] hover:border-[#F3EEE1]/30 transition-colors">
              <Target className="h-3.5 w-3.5" /> Instead run a mission
            </a>
          </div>
        </div>
      </motion.header>

      <main className="relative z-10 flex-1">
        <div className="mx-auto w-full max-w-[95vw] sm:max-w-xl lg:max-w-2xl px-2 sm:px-4 pt-24 sm:pt-28 pb-16">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-10"
          >
            <h1 className="text-[2.4rem] sm:text-[3rem] font-medium tracking-tight leading-[1.05]" style={{ fontFamily: "var(--font-display)" }}>
              Analyze <span className="italic text-[#C9A227]">any opportunity</span>
            </h1>
            <p className="mt-3 text-sm text-[#F3EEE1]/45 leading-relaxed max-w-md mx-auto">
              Paste a link or listing text. The autonomous agent extracts the details,
              scores your fit, maps skill gaps, and builds an application strategy.
            </p>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-[#F3EEE1]/10 px-6 py-4">
              <div className="flex items-center gap-3">
                <Bot className="h-5 w-5 text-[#C9A227]" />
                <span className="text-base font-medium text-[#F3EEE1]/90" style={{ fontFamily: "var(--font-display)" }}>
                  Opportunity source
                </span>
              </div>
              <span className="hidden sm:flex items-center gap-1.5 font-mono text-sm text-[#F3EEE1]/30">
                <Sparkles className="h-3.5 w-3.5 text-[#C9A227]/60" /> Gemma 4 analysis
              </span>
            </div>

            <div className="p-6 space-y-7">
              {/* Mode toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMode("url")}
                  className={`flex items-center justify-center gap-2 rounded-sm border px-4 py-3 text-sm font-medium transition-all ${
                    mode === "url"
                      ? "border-[#C9A227]/50 bg-[#C9A227]/10 text-[#C9A227]"
                      : "border-[#F3EEE1]/10 text-[#F3EEE1]/40 hover:text-[#F3EEE1]/70"
                  }`}
                >
                  <Link2 className="h-4 w-4" /> From a link
                </button>
                <button
                  onClick={() => setMode("text")}
                  className={`flex items-center justify-center gap-2 rounded-sm border px-4 py-3 text-sm font-medium transition-all ${
                    mode === "text"
                      ? "border-[#C9A227]/50 bg-[#C9A227]/10 text-[#C9A227]"
                      : "border-[#F3EEE1]/10 text-[#F3EEE1]/40 hover:text-[#F3EEE1]/70"
                  }`}
                >
                  <ClipboardPaste className="h-4 w-4" /> Paste text
                </button>
              </div>

              {/* URL input */}
              {mode === "url" ? (
                <div>
                  <label className="mb-2 block font-mono text-sm uppercase tracking-[0.15em] text-[#F3EEE1]/45">
                    Opportunity URL <span className="text-[#C2703D]">*</span>
                  </label>
                  <div className="flex gap-3">
                    <input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && launch()}
                      placeholder="https://provider.org/scholarship-page"
                      className="flex-1 border-0 border-b-[1.5px] border-[#F3EEE1]/15 bg-transparent py-3 text-base text-[#F3EEE1] placeholder:text-[#F3EEE1]/20 focus:border-[#C9A227] focus:outline-none transition-colors"
                    />
                    <button
                      onClick={() => navigator.clipboard.readText().then((t) => setUrl(t.trim())).catch(() => {})}
                      className="inline-flex items-center gap-1 rounded-sm border border-[#F3EEE1]/15 px-3 py-2.5 text-sm text-[#F3EEE1]/50 hover:text-[#F3EEE1] transition-colors"
                      title="Paste from clipboard"
                    >
                      <ClipboardPaste className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {EXAMPLE_LINKS.map((link) => (
                      <button
                        key={link}
                        onClick={() => setUrl(link)}
                        className="rounded-sm border border-[#F3EEE1]/[0.08] bg-[#F3EEE1]/[0.02] px-2.5 py-1 font-mono text-sm text-[#F3EEE1]/30 hover:text-[#C9A227]/70 hover:border-[#C9A227]/30 transition-colors truncate max-w-full"
                      >
                        {link.replace(/^https?:\/\//, "").slice(0, 42)}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="mb-2 block font-mono text-sm uppercase tracking-[0.15em] text-[#F3EEE1]/45">
                    Listing text <span className="text-[#C2703D]">*</span>
                  </label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste the full opportunity description, eligibility criteria, deadline, and benefits here..."
                    rows={8}
                    className="w-full resize-none rounded-sm border border-[#F3EEE1]/10 bg-[#0B0E13] p-4 text-sm text-[#F3EEE1]/70 placeholder:text-[#F3EEE1]/15 focus:border-[#C9A227]/40 focus:outline-none transition-colors"
                  />
                </div>
              )}

              {/* Profile (optional) */}
              <div>
                <button
                  onClick={() => setShowProfile(!showProfile)}
                  className="flex items-center gap-2 font-mono text-sm uppercase tracking-[0.15em] text-[#F3EEE1]/45 hover:text-[#F3EEE1]/70 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Your profile — for the fit analysis {showProfile ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                </button>

                {showProfile && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 space-y-5 overflow-hidden"
                  >
                    <div>
                      <label className="mb-2 block font-mono text-sm uppercase tracking-[0.15em] text-[#F3EEE1]/45">
                        Education / Degree
                      </label>
                      <input
                        value={education}
                        onChange={(e) => setEducation(e.target.value)}
                        placeholder="e.g. BSc Computer Science"
                        className="w-full border-0 border-b-[1.5px] border-[#F3EEE1]/15 bg-transparent py-3 text-base text-[#F3EEE1] placeholder:text-[#F3EEE1]/20 focus:border-[#C9A227] focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block font-mono text-sm uppercase tracking-[0.15em] text-[#F3EEE1]/45">
                        Skills
                      </label>
                      <div className="flex gap-3">
                        <input
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                          placeholder="Type a skill and press Enter..."
                          className="flex-1 border-0 border-b-[1.5px] border-[#F3EEE1]/15 bg-transparent py-3 text-base text-[#F3EEE1] placeholder:text-[#F3EEE1]/20 focus:border-[#C9A227] focus:outline-none transition-colors"
                        />
                        <button
                          onClick={addSkill}
                          disabled={!skillInput.trim()}
                          className="inline-flex items-center gap-1 rounded-sm border border-[#C9A227]/40 bg-[#C9A227]/10 px-4 py-2.5 text-sm font-semibold text-[#C9A227] hover:bg-[#C9A227]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="h-4 w-4" /> Add
                        </button>
                      </div>
                      {skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {skills.map((s) => (
                            <span key={s} className="inline-flex items-center gap-1.5 rounded-sm border border-[#3FA78E]/30 bg-[#3FA78E]/10 px-3 py-1.5 font-mono text-sm font-medium text-[#3FA78E]">
                              {s}
                              <button onClick={() => removeSkill(s)} className="hover:text-[#C2703D] transition-colors">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="mb-2 block font-mono text-sm uppercase tracking-[0.15em] text-[#F3EEE1]/45">
                        Your country
                      </label>
                      <input
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="e.g. Nigeria, Kenya, Ghana..."
                        className="w-full border-0 border-b-[1.5px] border-[#F3EEE1]/15 bg-transparent py-3 text-base text-[#F3EEE1] placeholder:text-[#F3EEE1]/20 focus:border-[#C9A227] focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block font-mono text-sm uppercase tracking-[0.15em] text-[#F3EEE1]/45">
                        Career goal <span className="text-[#F3EEE1]/25">(optional)</span>
                      </label>
                      <input
                        value={careerGoal}
                        onChange={(e) => setCareerGoal(e.target.value)}
                        placeholder="e.g. AI Research Scientist"
                        className="w-full border-0 border-b-[1.5px] border-[#F3EEE1]/15 bg-transparent py-3 text-base text-[#F3EEE1] placeholder:text-[#F3EEE1]/20 focus:border-[#C9A227] focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block font-mono text-sm uppercase tracking-[0.15em] text-[#F3EEE1]/45">
                        Experience level
                      </label>
                      <select
                        value={experienceLevel}
                        onChange={(e) => setExperienceLevel(e.target.value)}
                        className="w-full border-0 border-b-[1.5px] border-[#F3EEE1]/15 bg-transparent py-3 text-base text-[#F3EEE1] focus:border-[#C9A227] focus:outline-none transition-colors appearance-none"
                      >
                        <option value="" className="bg-[#12161D] text-base">Not specified</option>
                        <option value="entry" className="bg-[#12161D] text-base">Entry / Student</option>
                        <option value="mid" className="bg-[#12161D] text-base">Mid-level</option>
                        <option value="senior" className="bg-[#12161D] text-base">Senior</option>
                        <option value="lead" className="bg-[#12161D] text-base">Lead / Manager</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block font-mono text-sm uppercase tracking-[0.15em] text-[#F3EEE1]/45">
                        Email <span className="text-[#F3EEE1]/25">(for deadline reminders)</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full border-0 border-b-[1.5px] border-[#F3EEE1]/15 bg-transparent py-3 text-base text-[#F3EEE1] placeholder:text-[#F3EEE1]/20 focus:border-[#C9A227] focus:outline-none transition-colors"
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Footer / Actions */}
            <div className="border-t border-[#F3EEE1]/10 px-5 py-5 space-y-4">
              <button
                onClick={launch}
                disabled={(mode === "url" ? !url.trim() : !text.trim()) || loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-[#C9A227] px-6 py-4 text-base font-semibold text-[#0B0E13] transition-all hover:-translate-y-0.5 disabled:opacity-30 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" /> Launching agent...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Rocket className="h-5 w-5" /> Analyze with autonomous agent
                  </span>
                )}
              </button>

              <div className="flex items-center justify-between">
                <a href="/" className="inline-flex items-center gap-1 text-sm text-[#F3EEE1]/35 hover:text-[#F3EEE1]/60 transition-colors">
                  <ArrowRight className="h-4 w-4 -rotate-180" /> Back to home
                </a>
                <span className="font-mono text-sm text-[#F3EEE1]/25">
                  powered by Gemma 4
                </span>
              </div>
            </div>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 font-mono text-sm text-[#F3EEE1]/30"
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#C9A227]/50" /> Eligibility scoring
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#3FA78E]/50" /> Skill gap roadmap
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#C2703D]/50" /> Application plan
            </span>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
