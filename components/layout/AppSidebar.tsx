"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Crosshair, Cpu, Briefcase, FileText, Clock, History, Settings, ChevronRight,
  Menu, X, Sparkles, Stamp, CheckCircle2, Award,
} from "lucide-react";
import { useState } from "react";

const NAV = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/mission", icon: Crosshair, label: "Mission Builder" },
  { href: "/history", icon: History, label: "Mission History" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (pathname === "/" || pathname === "/mission") return null;

  const sessionMatch = pathname.match(/\/(?:agent|dashboard|workspace|memory|applications|report|opportunity|settings)\/([^/]+)/);
  const sessionId = sessionMatch?.[1];

  const sessionNav = sessionId ? [
    { href: `/agent/${sessionId}`, icon: Cpu, label: "Mission Control" },
    { href: `/dashboard/${sessionId}`, icon: LayoutDashboard, label: "Dashboard" },
    { href: `/workspace/${sessionId}`, icon: Briefcase, label: "Opportunities" },
    { href: `/applications/${sessionId}`, icon: CheckCircle2, label: "Applications" },
    { href: `/report/${sessionId}`, icon: Award, label: "Report" },
    { href: `/memory/${sessionId}`, icon: FileText, label: "Memory" },
    { href: `/settings/${sessionId}`, icon: Settings, label: "Settings" },
  ] : [];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-3 left-3 z-40 flex h-8 w-8 items-center justify-center rounded-sm border border-[#F3EEE1]/10 bg-[#0B0E13]/80 text-[#F3EEE1]/50 hover:text-[#F3EEE1] transition-colors lg:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 z-50 h-full w-56 border-r border-[#F3EEE1]/10 bg-[#0B0E13] transition-transform ${
        open ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[#F3EEE1]/10 px-4 py-3.5">
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-7 w-7 items-center justify-center rounded-sm border border-[#C9A227] text-[#C9A227] transition-transform group-hover:-rotate-6">
                <Stamp className="h-3.5 w-3.5" strokeWidth={1.75} />
              </div>
              <span className="text-sm font-medium text-[#F3EEE1]" style={{ fontFamily: "var(--font-display)" }}>Opportunity AI</span>
            </a>
            <button onClick={() => setOpen(false)} className="text-[#F3EEE1]/30 hover:text-[#F3EEE1] lg:hidden">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
            <p className="px-2 mb-2 font-mono text-[12px] uppercase tracking-[0.15em] text-[#F3EEE1]/25">Main</p>
            {NAV.map(item => (
              <button
                key={item.href}
                onClick={() => { router.push(item.href); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 rounded-sm px-3 py-2 text-[13px] transition-all ${
                  isActive(item.href)
                    ? "bg-[#C9A227]/10 text-[#C9A227] border border-[#C9A227]/20"
                    : "text-[#F3EEE1]/50 hover:text-[#F3EEE1] hover:bg-[#F3EEE1]/[0.03] border border-transparent"
                }`}
              >
                <item.icon className="h-4 w-4" strokeWidth={1.75} />
                {item.label}
                {isActive(item.href) && <ChevronRight className="h-3 w-3 ml-auto text-[#C9A227]/50" />}
              </button>
            ))}

            {sessionNav.length > 0 && (
              <>
                <div className="pt-4 pb-1">
                  <p className="px-2 font-mono text-[12px] uppercase tracking-[0.15em] text-[#F3EEE1]/25">Current Mission</p>
                </div>
                {sessionNav.map(item => (
                  <button
                    key={item.href}
                    onClick={() => { router.push(item.href); setOpen(false); }}
                    className={`w-full flex items-center gap-2.5 rounded-sm px-3 py-2 text-[13px] transition-all ${
                      isActive(item.href)
                        ? "bg-[#C9A227]/10 text-[#C9A227] border border-[#C9A227]/20"
                        : "text-[#F3EEE1]/50 hover:text-[#F3EEE1] hover:bg-[#F3EEE1]/[0.03] border border-transparent"
                    }`}
                  >
                    <item.icon className="h-4 w-4" strokeWidth={1.75} />
                    {item.label}
                    {isActive(item.href) && <ChevronRight className="h-3 w-3 ml-auto text-[#C9A227]/50" />}
                  </button>
                ))}
              </>
            )}
          </div>

          <div className="border-t border-[#F3EEE1]/10 px-3 py-3">
            <a
              href="/mission"
              className="flex items-center justify-center gap-2 rounded-sm bg-[#C9A227] px-3 py-2 text-[14px] font-semibold text-[#0B0E13] hover:-translate-y-0.5 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" /> New Mission
            </a>
          </div>
        </div>
      </aside>

      <div className="hidden lg:block w-56 shrink-0" />
    </>
  );
}
