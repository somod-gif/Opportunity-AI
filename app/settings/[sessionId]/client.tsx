"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, CheckCircle2, Cpu, Database, Mail, Radio, Shield, Trash2, XCircle } from "lucide-react";

interface Props {
  sessionId: string;
  missionGoal: string | null;
  status: {
    provider: string;
    model: string;
    database: boolean;
    email: boolean;
    emailFrom: string;
    openrouter: boolean;
  };
}

const PREF_KEY = "oa-settings";

export function SettingsClient({ sessionId, missionGoal, status }: Props) {
  const [email, setEmail] = useState("");
  const [timings, setTimings] = useState({ oneDay: true, threeDays: false, oneWeek: false, today: true });
  const [saved, setSaved] = useState(false);
  const [testSent, setTestSent] = useState<null | boolean>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREF_KEY);
      if (raw) {
        const prefs = JSON.parse(raw);
        if (prefs.email) setEmail(prefs.email);
        if (prefs.timings) setTimings({ ...timings, ...prefs.timings });
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function save() {
    localStorage.setItem(PREF_KEY, JSON.stringify({ email: email.trim(), timings }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function clear() {
    localStorage.removeItem(PREF_KEY);
    setEmail("");
    setTimings({ oneDay: true, threeDays: false, oneWeek: false, today: true });
  }

  async function sendTest() {
    if (!email.trim()) return;
    setTestSent(null);
    const res = await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        type: "follow_up",
        message: "This is a test reminder from Opportunity AI. Your deadline alert settings are working.",
        dueAt: new Date().toISOString(),
        email: email.trim(),
        opportunityTitle: "Opportunity AI — Test Reminder",
      }),
    });
    const data = await res.json();
    setTestSent(data.success);
  }

  const providerLabel = status.provider === "gemma" ? "Google AI Studio" : status.provider === "openrouter" ? "OpenRouter" : status.provider;

  return (
    <div className="min-h-screen bg-[#0B0E13] text-[#F3EEE1]" style={{ fontFamily: "var(--font-body)" }}>
      <div className="pointer-events-none fixed -top-40 right-0 z-0 h-[560px] w-[560px] rounded-full bg-[#C9A227]/[0.06] blur-[140px]" />
      <div className="mx-auto max-w-4xl px-4 py-8 relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href={`/dashboard/${sessionId}`} className="text-[#F3EEE1]/30 hover:text-[#F3EEE1]/60 transition-colors">
            <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
          </Link>
          <div>
            <h1 className="text-xl font-medium" style={{ fontFamily: "var(--font-display)" }}>Settings</h1>
            <p className="text-sm text-[#F3EEE1]/40">{missionGoal || "Mission configuration"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D]/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="h-4 w-4 text-[#C9A227]" strokeWidth={1.75} />
              <h2 className="text-sm font-medium" style={{ fontFamily: "var(--font-display)" }}>AI Engine</h2>
            </div>
            <div className="space-y-2.5 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="text-[#F3EEE1]/40">Provider</span>
                <span className="font-mono text-[#3FA78E]">{providerLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#F3EEE1]/40">Model</span>
                <span className="font-mono">{status.model}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#F3EEE1]/40">Function calling</span>
                <span className="font-mono text-[#3FA78E]">Gemma native tools</span>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D]/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Radio className="h-4 w-4 text-[#C9A227]" strokeWidth={1.75} />
              <h2 className="text-sm font-medium" style={{ fontFamily: "var(--font-display)" }}>System Status</h2>
            </div>
            <div className="space-y-2.5 text-[13px]">
              {[
                { label: "Database (PostgreSQL)", ok: status.database },
                { label: "Email (Resend)", ok: status.email, extra: status.email ? status.emailFrom : undefined },
                { label: "Streaming (SSE)", ok: true },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-[#F3EEE1]/40">{row.label}</span>
                  <span className="flex items-center gap-1.5 font-mono">
                    {row.ok ? <CheckCircle2 className="h-3.5 w-3.5 text-[#3FA78E]" strokeWidth={2} /> : <XCircle className="h-3.5 w-3.5 text-[#C2703D]" strokeWidth={2} />}
                    {row.ok ? "Online" : "Not configured"}
                    {row.extra && <span className="text-[#F3EEE1]/25 text-[13px]">{row.extra}</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-[#F3EEE1]/10 bg-[#12161D]/60 p-5 mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="h-4 w-4 text-[#C9A227]" strokeWidth={1.75} />
            <h2 className="text-sm font-medium" style={{ fontFamily: "var(--font-display)" }}>Deadline Reminders</h2>
          </div>
          <p className="text-[14px] text-[#F3EEE1]/35 mb-4">
            Email reminders are sent by the agent via Resend. Choose when to be alerted before a deadline.
          </p>

          <label className="block text-[13px] text-[#F3EEE1]/40 mb-1.5">Email address</label>
          <div className="flex gap-2 mb-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 rounded-sm border border-[#F3EEE1]/10 bg-[#0B0E13] px-3 py-2 text-[13px] text-[#F3EEE1] placeholder:text-[#F3EEE1]/20 focus:border-[#C9A227]/40 focus:outline-none"
            />
            <button
              onClick={sendTest}
              disabled={!email.trim()}
              className="rounded-sm border border-[#C9A227]/30 px-3.5 py-2 text-[14px] font-medium text-[#C9A227] hover:bg-[#C9A227]/10 disabled:opacity-30 transition-colors"
            >
              Send test
            </button>
          </div>
          {testSent !== null && (
            <p className={`text-[14px] mb-3 ${testSent ? "text-[#3FA78E]" : "text-[#C2703D]"}`}>
              {testSent ? "Test reminder sent to your inbox." : "Email failed — check RESEND_API_KEY."}
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
            {[
              { key: "today", label: "Deadline today" },
              { key: "oneDay", label: "1 day before" },
              { key: "threeDays", label: "3 days before" },
              { key: "oneWeek", label: "1 week before" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTimings((prev) => ({ ...prev, [t.key]: !prev[t.key as keyof typeof prev] }))}
                className={`rounded-sm border px-3 py-2 text-[14px] transition-colors ${
                  timings[t.key as keyof typeof timings]
                    ? "border-[#3FA78E]/40 bg-[#3FA78E]/10 text-[#3FA78E]"
                    : "border-[#F3EEE1]/10 text-[#F3EEE1]/40 hover:text-[#F3EEE1]/70"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={save}
              className="rounded-sm bg-[#C9A227] px-4 py-2 text-[14px] font-semibold text-[#0B0E13] hover:-translate-y-0.5 transition-all"
            >
              Save preferences
            </button>
            {saved && <span className="text-[14px] text-[#3FA78E] flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Saved</span>}
            <button
              onClick={clear}
              className="rounded-sm border border-[#C2703D]/30 px-4 py-2 text-[14px] text-[#C2703D] hover:bg-[#C2703D]/10 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="rounded-sm border border-[#C2703D]/15 bg-[#C2703D]/[0.03] p-5">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-[#C2703D]" strokeWidth={1.75} />
            <h2 className="text-sm font-medium text-[#C2703D]" style={{ fontFamily: "var(--font-display)" }}>Danger Zone</h2>
          </div>
          <p className="text-[14px] text-[#F3EEE1]/35 mb-3">Clear locally stored preferences on this device. Mission data in the database is not affected.</p>
          <button
            onClick={clear}
            className="rounded-sm border border-[#C2703D]/40 px-4 py-2 text-[14px] font-medium text-[#C2703D] hover:bg-[#C2703D]/10 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5 inline mr-1.5" /> Clear local data
          </button>
        </div>

        <div className="mt-6 flex items-center gap-2 text-[13px] font-mono text-[#F3EEE1]/20">
          <Database className="h-3.5 w-3.5" /> Session: {sessionId.slice(0, 8)}…
        </div>
      </div>
    </div>
  );
}
