"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import { Fraunces, JetBrains_Mono, Inter } from "next/font/google";
import {
  Bot,
  Sparkles,
  ArrowRight,
  Plus,
  X,
  Rocket,
  Menu,
  Target,
  CheckCircle2,
  Loader2,
  Stamp as StampIcon,
  Upload,
  FileText,
  Wand2,
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

const EXAMPLES = [
  {
    goal: "I am a Nigerian Computer Science student looking for fully-funded AI scholarships in Canada",
    education: "BSc Computer Science",
    skills: ["Python", "Machine Learning", "Mathematics"],
    country: "Nigeria",
    careerGoal: "AI Research Scientist",
    experienceLevel: "entry",
  },
  {
    goal: "I need AI/ML internships in Europe for summer 2027",
    education: "MSc Data Science",
    skills: ["Python", "TensorFlow", "Statistics"],
    country: "Kenya",
    careerGoal: "ML Engineer",
    experienceLevel: "entry",
  },
  {
    goal: "I want a fully-funded Masters in Data Science anywhere in the world",
    education: "BSc Mathematics",
    skills: ["Statistics", "R", "Python"],
    country: "Ghana",
    careerGoal: "Data Scientist",
    experienceLevel: "entry",
  },
  {
    goal: "I am a Kenyan engineering graduate looking for tech fellowships",
    education: "BEng Electrical Engineering",
    skills: ["C++", "Embedded Systems", "IoT"],
    country: "Kenya",
    careerGoal: "Tech Lead",
    experienceLevel: "mid",
  },
  {
    goal: "I need conference funding for research in renewable energy",
    education: "MSc Renewable Energy",
    skills: ["Research", "Data Analysis", "Technical Writing"],
    country: "South Africa",
    careerGoal: "Energy Researcher",
    experienceLevel: "mid",
  },
];

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

export default function MissionPage() {
  const router = useRouter();
  const [goal, setGoal] = useState("");
  const [education, setEducation] = useState("");
  const [country, setCountry] = useState("");
  const [careerGoal, setCareerGoal] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // CV upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cvFileName, setCvFileName] = useState("");
  const [cvText, setCvText] = useState("");
  const [cvParsing, setCvParsing] = useState(false);
  const [showCvPaste, setShowCvPaste] = useState(false);

  async function handleCvFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["txt", "pdf", "docx"].includes(ext || "")) {
      alert("Please upload a .txt, .pdf, or .docx file");
      return;
    }
    setCvFileName(file.name);
    try {
      const text = await file.text();
      setCvText(text);
      setShowCvPaste(false);
    } catch {
      alert("Could not read file. Try pasting the content instead.");
    }
  }

  async function parseCv() {
    if (!cvText.trim()) return;
    setCvParsing(true);
    try {
      const { parseCVText } = await import("@/lib/actions/parse-cv");
      const result = await parseCVText(cvText);
      if (result.success && result.data) {
        if (result.data.education) setEducation(result.data.education);
        if (result.data.skills) setSkills(result.data.skills);
        if (result.data.careerGoal) setCareerGoal(result.data.careerGoal);
        if (result.data.experienceLevel) setExperienceLevel(result.data.experienceLevel);
      }
    } catch (e) {
      console.error("CV parse error:", e);
    }
    setCvParsing(false);
  }



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

  function fillExample(ex: (typeof EXAMPLES)[number]) {
    setGoal(ex.goal);
    setEducation(ex.education);
    setSkills(ex.skills);
    setCountry(ex.country);
    setCareerGoal(ex.careerGoal);
    setExperienceLevel(ex.experienceLevel || "");
  }

  function launchAgent() {
    if (!goal.trim()) return;
    setLoading(true);
    const sessionId = uuidv4();
    const params = new URLSearchParams({ goal: goal.trim() });
    if (education.trim()) params.set("education", education.trim());
    if (skills.length > 0) params.set("skills", skills.join(","));
    if (country.trim()) params.set("country", country.trim());
    if (careerGoal.trim()) params.set("careerGoal", careerGoal.trim());
    if (experienceLevel) params.set("experienceLevel", experienceLevel);
    if (email.trim()) params.set("email", email.trim());
    router.push(`/agent/${sessionId}?${params.toString()}`);
  }

  return (
    <div
      className={`${display.variable} ${mono.variable} ${body.variable} relative min-h-screen bg-[#0B0E13] text-[#F3EEE1] antialiased`}
      style={{ fontFamily: "var(--font-body)" }}
    >
      <GrainOverlay />
      <div className="pointer-events-none fixed -top-40 right-0 z-0 h-[560px] w-[560px] rounded-full bg-[#C9A227]/[0.06] blur-[140px]" />
      <div className="pointer-events-none fixed -bottom-40 left-0 z-0 h-[400px] w-[400px] rounded-full bg-[#3FA78E]/[0.04] blur-[120px]" />

      {/* NAV */}
      <header className="fixed top-0 z-50 w-full px-2 sm:px-4">
        <div className="mx-auto max-w-7xl mt-2 rounded-sm border border-[#F3EEE1]/10 bg-[#0B0E13]/90 backdrop-blur-md shadow-[0_1px_0_rgba(243,238,225,0.06)]">
          <div className="mx-auto flex h-12 sm:h-14 items-center justify-between px-3 sm:px-6">
            <a href="/" className="group flex items-center gap-2 sm:gap-3">
              <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-sm border-[1.5px] border-[#C9A227] text-[#C9A227] transition-transform group-hover:-rotate-6">
                <StampIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </div>
              <div className="leading-none">
                <span
                  className="block text-xs sm:text-sm font-medium tracking-tight text-[#F3EEE1]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Opportunity AI
                </span>
                <span className="mt-0.5 hidden sm:block font-mono text-xs uppercase tracking-[0.2em] text-[#F3EEE1]/35">
                  Mission intake
                </span>
              </div>
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1">
        <div className="mx-auto w-full max-w-[95vw] sm:max-w-xl lg:max-w-2xl px-2 sm:px-4 pt-24 sm:pt-28 pb-16 sm:px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-10"
          >
            <h1
              className="text-[2.4rem] sm:text-[3rem] font-medium tracking-tight leading-[1.05]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              File your{" "}
              <span className="italic text-[#C9A227]">mission brief</span>
            </h1>
            <p className="mt-3 text-sm text-[#F3EEE1]/45 leading-relaxed max-w-md mx-auto">
              Describe your goal, education, skills, and preferences. The
              autonomous agent handles everything else.
            </p>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              delay: 0.15,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-[#F3EEE1]/10 px-6 py-4">
              <div className="flex items-center gap-3">
                <Bot
                  className="h-5 w-5 text-[#C9A227]"
                />
                <span
                  className="text-base font-medium text-[#F3EEE1]/90"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Intake dossier
                </span>
              </div>
            </div>

            <div className="p-6 space-y-7">
              {/* Goal */}
              <div>
                <label className="mb-2 block font-mono text-sm uppercase tracking-[0.15em] text-[#F3EEE1]/45">
                  Mission goal <span className="text-[#C2703D]">*</span>
                </label>
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g. I am a Nigerian CS student looking for fully-funded AI scholarships in Canada..."
                  rows={4}
                  className="w-full resize-none border-0 border-b-[1.5px] border-[#F3EEE1]/15 bg-transparent py-3 text-base text-[#F3EEE1] placeholder:text-[#F3EEE1]/20 focus:border-[#C9A227] focus:outline-none transition-colors"
                />
              </div>

              {/* CV Upload */}
              <div>
                <label className="mb-2 block font-mono text-sm uppercase tracking-[0.15em] text-[#F3EEE1]/45">
                  Optional — Upload CV to auto-fill
                </label>
                <div className="space-y-3">
                  {!cvFileName ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const f = e.dataTransfer.files[0];
                        if (f) handleCvFile(f);
                      }}
                      className="flex cursor-pointer items-center justify-center gap-3 rounded-sm border border-dashed border-[#F3EEE1]/20 bg-[#F3EEE1]/[0.02] px-5 py-6 text-base text-[#F3EEE1]/30 hover:border-[#C9A227]/40 hover:bg-[#C9A227]/[0.03] hover:text-[#F3EEE1]/50 transition-colors"
                    >
                      <Upload className="h-5 w-5" />
                      <span>Drop your CV here or click to browse</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.pdf,.docx"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleCvFile(f);
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-sm border border-[#3FA78E]/30 bg-[#3FA78E]/10 px-5 py-4">
                      <FileText className="h-5 w-5 text-[#3FA78E]" />
                      <span className="flex-1 text-base text-[#F3EEE1]/70 truncate">
                        {cvFileName}
                      </span>
                      {cvParsing ? (
                        <Loader2 className="h-5 w-5 animate-spin text-[#C9A227]" />
                      ) : (
                        <button
                          onClick={parseCv}
                          className="inline-flex items-center gap-1 rounded-sm bg-[#C9A227]/20 px-3 py-1.5 text-sm font-semibold text-[#C9A227] hover:bg-[#C9A227]/30 transition-colors"
                        >
                          <Wand2 className="h-4 w-4" /> Parse with AI
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setCvFileName("");
                          setCvText("");
                        }}
                        className="text-[#F3EEE1]/30 hover:text-[#C2703D] transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {cvFileName && !showCvPaste && (
                    <button
                      onClick={() => setShowCvPaste(!showCvPaste)}
                      className="text-sm text-[#F3EEE1]/30 hover:text-[#F3EEE1]/50 transition-colors"
                    >
                      {showCvPaste ? "Hide" : "Or paste CV text manually"}
                    </button>
                  )}
                  {showCvPaste && (
                    <textarea
                      value={cvText}
                      onChange={(e) => setCvText(e.target.value)}
                      placeholder="Paste your CV text here..."
                      rows={5}
                      className="w-full resize-none rounded-sm border border-[#F3EEE1]/10 bg-[#0B0E13] p-4 text-sm text-[#F3EEE1]/60 placeholder:text-[#F3EEE1]/15 focus:border-[#C9A227]/40 focus:outline-none transition-colors"
                    />
                  )}
                </div>
              </div>

              {/* Education */}
              <div>
                <label className="mb-2 block font-mono text-sm uppercase tracking-[0.15em] text-[#F3EEE1]/45">
                  Education / Degree
                </label>
                <input
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="e.g. BSc Computer Science, MSc Data Science..."
                  className="w-full border-0 border-b-[1.5px] border-[#F3EEE1]/15 bg-transparent py-3 text-base text-[#F3EEE1] placeholder:text-[#F3EEE1]/20 focus:border-[#C9A227] focus:outline-none transition-colors"
                />
              </div>

              {/* Skills */}
              <div>
                <label className="mb-2 block font-mono text-sm uppercase tracking-[0.15em] text-[#F3EEE1]/45">
                  Skills
                </label>
                <div className="flex gap-3">
                  <input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addSkill())
                    }
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
                      <span
                        key={s}
                        className="inline-flex items-center gap-1.5 rounded-sm border border-[#3FA78E]/30 bg-[#3FA78E]/10 px-3 py-1.5 font-mono text-sm font-medium text-[#3FA78E]"
                      >
                        {s}
                        <button
                          onClick={() => removeSkill(s)}
                          className="hover:text-[#C2703D] transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Country */}
              <div>
                <label className="mb-2 block font-mono text-sm uppercase tracking-[0.15em] text-[#F3EEE1]/45">
                  Your country
                </label>
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Nigeria, Kenya, Ghana, South Africa..."
                  className="w-full border-0 border-b-[1.5px] border-[#F3EEE1]/15 bg-transparent py-3 text-base text-[#F3EEE1] placeholder:text-[#F3EEE1]/20 focus:border-[#C9A227] focus:outline-none transition-colors"
                />
              </div>

              {/* Career Goal */}
              <div>
                <label className="mb-2 block font-mono text-sm uppercase tracking-[0.15em] text-[#F3EEE1]/45">
                  Career goal{" "}
                  <span className="text-[#F3EEE1]/25">(optional)</span>
                </label>
                <input
                  value={careerGoal}
                  onChange={(e) => setCareerGoal(e.target.value)}
                  placeholder="e.g. AI Research Scientist, ML Engineer, Data Scientist..."
                  className="w-full border-0 border-b-[1.5px] border-[#F3EEE1]/15 bg-transparent py-3 text-base text-[#F3EEE1] placeholder:text-[#F3EEE1]/20 focus:border-[#C9A227] focus:outline-none transition-colors"
                />
              </div>

              {/* Experience Level */}
              <div>
                <label className="mb-2 block font-mono text-sm uppercase tracking-[0.15em] text-[#F3EEE1]/45">
                  Experience level{" "}
                  <span className="text-[#F3EEE1]/25">(optional)</span>
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
                  <option value="executive" className="bg-[#12161D] text-base">Executive</option>
                </select>
              </div>

              {/* Email (for reminders) */}
              <div>
                <label className="mb-2 block font-mono text-sm uppercase tracking-[0.15em] text-[#F3EEE1]/45">
                  Email{" "}
                  <span className="text-[#F3EEE1]/25">(for deadline reminders)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border-0 border-b-[1.5px] border-[#F3EEE1]/15 bg-transparent py-3 text-base text-[#F3EEE1] placeholder:text-[#F3EEE1]/20 focus:border-[#C9A227] focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Footer / Actions */}
            <div className="border-t border-[#F3EEE1]/10 px-5 py-5 space-y-4">
              <button
                onClick={launchAgent}
                disabled={!goal.trim() || loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-[#C9A227] px-6 py-4 text-base font-semibold text-[#0B0E13] transition-all hover:-translate-y-0.5 disabled:opacity-30 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" /> Launching
                    agent...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Rocket className="h-5 w-5" /> Launch autonomous agent
                  </span>
                )}
              </button>

              <div className="flex items-center justify-between">
                <a
                  href="/"
                  className="inline-flex items-center gap-1 text-sm text-[#F3EEE1]/35 hover:text-[#F3EEE1]/60 transition-colors"
                >
                  <ArrowRight className="h-4 w-4 -rotate-180" /> Back to home
                </a>
                <span className="font-mono text-xs text-[#F3EEE1]/25">
                  powered by Gemma 4
                </span>
              </div>
            </div>
          </motion.div>

          {/* Examples */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              delay: 0.3,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="mt-10"
          >
            <div className="flex items-center gap-3 mb-4">
              <Target
                className="h-4 w-4 text-[#C2703D]"
              />
              <p className="font-mono text-sm uppercase tracking-[0.15em] text-[#F3EEE1]/35">
                Try an example mission
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => fillExample(ex)}
                  className="group text-left rounded-sm border border-[#F3EEE1]/[0.06] bg-[#F3EEE1]/[0.02] px-5 py-3 text-sm text-[#F3EEE1]/35 hover:border-[#C9A227]/30 hover:bg-[#C9A227]/[0.04] hover:text-[#F3EEE1]/60 transition-all"
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="font-mono text-xs text-[#F3EEE1]/20">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {ex.goal.length > 80 ? ex.goal.slice(0, 80) + "..." : ex.goal}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="mt-8 flex items-center justify-center gap-x-8 gap-y-2 font-mono text-sm text-[#F3EEE1]/30"
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#C9A227]/50" /> 12
              specialized agents
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#3FA78E]/50" /> 10+ search
              tools
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#C2703D]/50" /> No signup
              required
            </span>
          </motion.div>
        </div>
      </main>
    </div>
  );
}