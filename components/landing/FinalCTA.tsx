"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkles, ArrowRight, Bot, Shield } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5">
            <Bot className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-medium text-primary">Ready?</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15]">
            Ready to launch your
            <br />
            <span className="text-gradient">next opportunity?</span>
          </h2>

          <p className="text-base text-muted-foreground/70 max-w-lg mx-auto">
            One prompt. Multiple AI agents collaborate autonomously to discover opportunities,
            analyze eligibility, generate applications, and prepare everything you need.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/mission"
              className="group inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-primary to-primary/80 px-8 py-4 text-base font-semibold text-white shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-105 active:scale-[0.98] transition-all"
            >
              <Sparkles className="h-5 w-5" />
              Launch Your AI Mission
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#agents"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-4 text-base font-medium text-foreground/70 hover:bg-white/[0.06] hover:text-foreground hover:border-white/20 active:scale-[0.98] transition-all"
            >
              Watch Live Demo
            </Link>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground/40">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-ash-400/60" /> No signup required
            </span>
            <span className="w-px h-4 bg-white/10" />
            <span>Powered by Gemma 4</span>
            <span className="w-px h-4 bg-white/10" />
            <span>Free during Beta</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
