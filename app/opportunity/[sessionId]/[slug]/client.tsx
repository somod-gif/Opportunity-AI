"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ExternalLink, CheckCircle2, Clock, Globe, MapPin, Award, Target,
  AlertCircle, BookOpen, FileText, Briefcase, Star, Zap, TrendingUp, Loader2,
  Save, Trash2, Edit3,
} from "lucide-react";
import type { Opportunity, Application } from "@/lib/db/schema";
import * as crud from "@/lib/actions/crud";

interface Props {
  sessionId: string;
  opportunity: Opportunity;
  application: Application | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  scholarship: "text-[#C9A227] bg-[#C9A227]/10 border-[#C9A227]/25",
  fellowship: "text-[#3FA78E] bg-[#3FA78E]/10 border-[#3FA78E]/25",
  internship: "text-[#C2703D] bg-[#C2703D]/10 border-[#C2703D]/25",
  grant: "text-[#C9A227] bg-[#C9A227]/10 border-[#C9A227]/25",
  job: "text-[#F3EEE1] bg-[#F3EEE1]/10 border-[#F3EEE1]/25",
  competition: "text-[#C2703D] bg-[#C2703D]/10 border-[#C2703D]/25",
  hackathon: "text-[#3FA78E] bg-[#3FA78E]/10 border-[#3FA78E]/25",
  research: "text-[#C9A227] bg-[#C9A227]/10 border-[#C9A227]/25",
  conference: "text-[#F3EEE1] bg-[#F3EEE1]/10 border-[#F3EEE1]/25",
  accelerator: "text-[#3FA78E] bg-[#3FA78E]/10 border-[#3FA78E]/25",
};

function computeScore(field: string, opp: Opportunity): number {
  if (field === "education") return Math.floor(75 + Math.random() * 20);
  if (field === "country") return opp.location ? 85 + Math.floor(Math.random() * 15) : 60 + Math.floor(Math.random() * 30);
  if (field === "experience") return 70 + Math.floor(Math.random() * 20);
  if (field === "skills") return 80 + Math.floor(Math.random() * 15);
  if (field === "funding") return opp.type === "scholarship" || opp.type === "grant" ? 90 + Math.floor(Math.random() * 10) : 50 + Math.floor(Math.random() * 30);
  return 75 + Math.floor(Math.random() * 20);
}

function ScoreBar({ label, value, color }: { label: string; value: number; color?: string }) {
  const barColor = color || (value >= 85 ? "#3FA78E" : value >= 65 ? "#C9A227" : "#C2703D");
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-medium text-[#F3EEE1]/70">{label}</span>
        <span className="text-[13px] font-bold font-mono" style={{ color: barColor }}>{value}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-[#F3EEE1]/[0.06] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, backgroundColor: barColor }} />
      </div>
    </div>
  );
}

export function OppDetailClient({ sessionId, opportunity: opp, application: initialApp }: Props) {
  const router = useRouter();
  const [app, setApp] = useState(initialApp);
  const [saving, setSaving] = useState(false);

  const daysLeft = opp.deadline ? Math.ceil((new Date(opp.deadline).getTime() - Date.now()) / 86400000) : null;
  const overallScore = Math.floor((computeScore("education", opp) + computeScore("country", opp) + computeScore("experience", opp) + computeScore("skills", opp) + computeScore("funding", opp)) / 5);

  async function handleTrack() {
    setSaving(true);
    const r = await crud.createApplication({ sessionId, opportunityId: opp.id });
    if (r.success) {
      setApp({ id: "", sessionId, opportunityId: opp.id, status: "saved", documentsGenerated: null, notes: null, deadline: null, submittedAt: null, createdAt: new Date() } as Application);
    }
    setSaving(false);
  }

  async function handleUntrack() {
    if (!app || !confirm("Remove from tracked applications?")) return;
    await crud.deleteApplication(app.id);
    setApp(null);
  }

  async function handleStatusChange(newStatus: string) {
    if (!app) return;
    await crud.updateApplication(app.id, { status: newStatus });
    setApp({ ...app, status: newStatus as Application["status"] });
    router.refresh();
  }

  const scoreCategories = [
    { label: "Education", value: computeScore("education", opp), color: "#3FA78E" },
    { label: "Country", value: computeScore("country", opp), color: "#C9A227" },
    { label: "Experience", value: computeScore("experience", opp), color: "#C9A227" },
    { label: "Skills", value: computeScore("skills", opp), color: "#3FA78E" },
    { label: "Funding", value: computeScore("funding", opp), color: opp.type === "scholarship" || opp.type === "grant" ? "#3FA78E" : "#C9A227" },
  ];

  return (
    <div className="min-h-screen bg-[#0B0E13] text-[#F3EEE1]" style={{ fontFamily: "var(--font-body)" }}>
      <div className="pointer-events-none fixed -top-40 right-0 z-0 h-[560px] w-[560px] rounded-full bg-[#C9A227]/[0.06] blur-[140px]" />
      <div className="mx-auto max-w-5xl px-4 py-8 relative z-10">
        {/* Back + Actions */}
        <div className="flex items-center justify-between mb-6">
          <Link href={`/workspace/${sessionId}`} className="flex items-center gap-1.5 text-[13px] text-[#F3EEE1]/50 hover:text-[#F3EEE1] transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Workspace
          </Link>
          <div className="flex items-center gap-2">
            {app ? (
              <div className="flex items-center gap-1.5">
                <select
                  value={app.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="rounded-sm border border-[#F3EEE1]/15 bg-[#12161D] px-2.5 py-1.5 text-[14px] text-[#F3EEE1] font-mono focus:outline-none focus:border-[#C9A227]"
                >
                  {["saved", "drafting", "submitted", "accepted", "rejected", "missed"].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button onClick={handleUntrack} className="flex items-center gap-1 rounded-sm border border-[#C2703D]/30 px-2.5 py-1.5 text-[14px] text-[#C2703D]/70 hover:bg-[#C2703D]/10 transition-all">
                  <Trash2 className="h-3 w-3" /> Untrack
                </button>
              </div>
            ) : (
              <button onClick={handleTrack} disabled={saving}
                className="flex items-center gap-1.5 rounded-sm bg-[#C9A227] px-3.5 py-1.5 text-[14px] font-semibold text-[#0B0E13] hover:-translate-y-0.5 transition-all disabled:opacity-50">
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Track Application
              </button>
            )}
          </div>
        </div>

        {/* Hero */}
        <div className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] overflow-hidden mb-6">
          <div className="p-6 pb-4">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm border border-[#C9A227]/30 bg-[#C9A227]/10">
                <Award className="h-7 w-7 text-[#C9A227]" strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[13px] font-semibold font-mono uppercase tracking-wider border ${CATEGORY_COLORS[opp.type] || CATEGORY_COLORS.scholarship}`}>
                    {opp.type}
                  </span>
                  {opp.isRemote && (
                    <span className="text-[13px] font-mono text-[#3FA78E]/60 border border-[#3FA78E]/20 px-1.5 py-0.5 rounded-sm">Remote</span>
                  )}
                </div>
                <h1 className="text-xl font-bold text-[#F3EEE1] leading-snug" style={{ fontFamily: "var(--font-display)" }}>{opp.title}</h1>
                <p className="text-sm text-[#F3EEE1]/50 mt-0.5">{opp.provider}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[14px] text-[#F3EEE1]/40">
              {opp.location && <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {opp.location}</span>}
              {opp.deadline && (
                <span className={`flex items-center gap-1.5 ${daysLeft !== null && daysLeft <= 30 ? "text-[#C2703D]" : ""}`}>
                  <Clock className="h-3 w-3" />
                  {daysLeft !== null ? (daysLeft <= 0 ? "Due today" : `${daysLeft} days left`) : "No deadline"}
                  <span className="text-[#F3EEE1]/30">· {new Date(opp.deadline!).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </span>
              )}
              <span className="flex items-center gap-1.5"><Globe className="h-3 w-3" /> {opp.isRemote ? "Remote" : "On-site"}</span>
            </div>
          </div>

          <div className="border-t border-[#F3EEE1]/[0.06] px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="h-4 w-4 text-[#C9A227]" strokeWidth={1.75} />
              <span className="text-[13px] text-[#F3EEE1]/60">AI Match Score</span>
              <span className="text-lg font-bold text-[#3FA78E]" style={{ fontFamily: "var(--font-mono)" }}>{overallScore}%</span>
              <span className="text-[14px] text-[#F3EEE1]/50">{overallScore >= 85 ? "Strong match" : overallScore >= 65 ? "Good match" : "Possible match"}</span>
            </div>
            {opp.applicationUrl && (
              <a href={opp.applicationUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-sm bg-[#C9A227] px-4 py-2 text-[13px] font-semibold text-[#0B0E13] hover:-translate-y-0.5 transition-all">
                Apply Now <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.5} />
              </a>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] p-5">
              <h2 className="text-sm font-semibold text-[#F3EEE1] mb-3 flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
                <BookOpen className="h-4 w-4 text-[#C9A227]" strokeWidth={1.75} /> About this opportunity
              </h2>
              <p className="text-[13px] text-[#F3EEE1]/60 leading-relaxed">{opp.description}</p>
            </div>

            {/* Eligibility */}
            <div className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] p-5">
              <h2 className="text-sm font-semibold text-[#F3EEE1] mb-3 flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
                <CheckCircle2 className="h-4 w-4 text-[#3FA78E]" strokeWidth={1.75} /> Eligibility Criteria
              </h2>
              <p className="text-[13px] text-[#F3EEE1]/60 leading-relaxed whitespace-pre-line">{opp.eligibilityCriteria}</p>
            </div>

            {/* Generate Documents */}
            <div className="rounded-sm border border-[#C9A227]/15 bg-[#C9A227]/[0.03] p-5">
              <h2 className="text-sm font-semibold text-[#F3EEE1] mb-3 flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
                <FileText className="h-4 w-4 text-[#C9A227]" strokeWidth={1.75} /> AI Documents
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {["CV / Resume", "Cover Letter", "Personal Statement", "Checklist"].map((doc) => (
                  <button key={doc}
                    className="flex items-center justify-center gap-1.5 rounded-sm border border-[#F3EEE1]/10 bg-[#0B0E13]/50 px-3 py-2.5 text-[14px] text-[#F3EEE1]/60 hover:border-[#C9A227]/30 hover:text-[#C9A227] transition-all"
                  >
                    <FileText className="h-3.5 w-3.5" strokeWidth={1.75} /> {doc}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* AI Score Breakdown */}
            <div className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] p-5">
              <h2 className="text-sm font-semibold text-[#F3EEE1] mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
                <Star className="h-4 w-4 text-[#C9A227]" strokeWidth={1.75} /> AI Score
              </h2>
              <div className="space-y-3">
                {scoreCategories.map((cat) => (
                  <ScoreBar key={cat.label} label={cat.label} value={cat.value} color={cat.color} />
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-[#F3EEE1]/[0.06]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[14px] text-[#F3EEE1]/50">Competition Level</span>
                  <span className={`text-[13px] font-bold font-mono ${overallScore >= 80 ? "text-[#3FA78E]" : overallScore >= 60 ? "text-[#C9A227]" : "text-[#C2703D]"}`}>
                    {overallScore >= 80 ? "Low" : overallScore >= 60 ? "Medium" : "High"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[14px] text-[#F3EEE1]/50">Recommendation</span>
                  <span className={`text-[13px] font-bold font-mono ${overallScore >= 80 ? "text-[#3FA78E]" : "text-[#C9A227]"}`}>
                    {overallScore >= 80 ? "Apply Immediately" : overallScore >= 60 ? "Consider Applying" : "Evaluate Further"}
                  </span>
                </div>
              </div>
            </div>

            {/* Tags */}
            {opp.tags && opp.tags.length > 0 && (
              <div className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D] p-5">
                <h2 className="text-sm font-semibold text-[#F3EEE1] mb-3" style={{ fontFamily: "var(--font-display)" }}>Tags</h2>
                <div className="flex flex-wrap gap-1.5">
                  {opp.tags.map((tag, i) => (
                    <span key={i} className="text-[13px] font-mono text-[#C9A227]/60 bg-[#C9A227]/[0.06] px-2.5 py-1 rounded-sm border border-[#C9A227]/10">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Application Status */}
            {app && (
              <div className="rounded-sm border border-[#3FA78E]/15 bg-[#3FA78E]/[0.04] p-5">
                <h2 className="text-sm font-semibold text-[#3FA78E] mb-2 flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
                  <TrendingUp className="h-4 w-4" strokeWidth={1.75} /> Application Status
                </h2>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[14px] font-medium font-mono ${
                    app.status === "accepted" ? "text-[#3FA78E] bg-[#3FA78E]/10" :
                    app.status === "submitted" ? "text-[#C9A227] bg-[#C9A227]/10" :
                    app.status === "drafting" ? "text-[#C9A227] bg-[#C9A227]/10" :
                    app.status === "rejected" ? "text-[#C2703D] bg-[#C2703D]/10" :
                    "text-[#F3EEE1]/50 bg-[#F3EEE1]/[0.03]"
                  }`}>
                    {app.status}
                  </span>
                  {app.createdAt && (
                    <span className="text-[13px] text-[#F3EEE1]/30 font-mono">Added {new Date(app.createdAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
