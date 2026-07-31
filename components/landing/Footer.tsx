"use client";

import Link from "next/link";
import { Bot, Heart, Globe } from "lucide-react";

const footerLinks = [
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "AI Agents", href: "#agents" },
  { label: "Technology", href: "#tech" },
  { label: "Mission", href: "/mission" },
  { label: "GitHub", href: "https://github.com" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/5">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold">Opportunity AI</span>
            </div>
            <p className="text-[13px] text-muted-foreground/50 leading-relaxed max-w-xs">
              An autonomous AI career agent that discovers, evaluates, and applies to opportunities across Africa.
            </p>
            <div className="flex items-center gap-3">
              <Link href="https://github.com" className="text-muted-foreground/40 hover:text-foreground transition-colors">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </Link>
              <Link href="https://twitter.com" className="text-muted-foreground/40 hover:text-foreground transition-colors">
                <Globe className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-foreground/60 mb-3">Product</h4>
            <ul className="space-y-2">
              {footerLinks.slice(0, 4).map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-muted-foreground/40 hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground/60 mb-3">Links</h4>
            <ul className="space-y-2">
              {footerLinks.slice(4).map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-muted-foreground/40 hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Built with */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground/60 mb-3">Built with</h4>
            <div className="flex flex-wrap gap-2">
              {["Gemma 4", "Next.js", "TypeScript", "Neon", "Tailwind", "Framer"].map((tech) => (
                <span
                  key={tech}
                  className="inline-flex rounded-md border border-white/5 bg-white/[0.02] px-2 py-1 text-[9px] text-muted-foreground/50"
                >
                  {tech}
                </span>
              ))}
            </div>
            <p className="flex items-center gap-1 text-[12px] text-muted-foreground/30 pt-2">
              Built with <Heart className="h-3 w-3 text-ash-400/60" /> for the
            </p>
            <p className="text-[12px] text-muted-foreground/30">
              Build with Gemma: AI for Africa Hackathon 2026
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-muted-foreground/30">
            © 2026 Opportunity AI. All rights reserved.
          </p>
          <p className="text-[12px] text-muted-foreground/30">
            Best Autonomous AI Agent — Build with Gemma: AI for Africa
          </p>
        </div>
      </div>
    </footer>
  );
}
