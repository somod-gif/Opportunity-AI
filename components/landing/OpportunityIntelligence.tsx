"use client";

import { motion } from "framer-motion";
import {
  Star, Shield, Clock, DollarSign, FileText, Brain,
  CheckCircle2, AlertCircle, ExternalLink, Zap, Award, TrendingUp
} from "lucide-react";

const opportunities = [
  {
    title: "Mastercard Foundation Scholars Program",
    provider: "Mastercard Foundation",
    matchScore: 96,
    eligibilityScore: 92,
    successProbability: 78,
    competitionLevel: "Medium",
    deadline: "Apr 15, 2026",
    funding: "Full Tuition + Living",
    documents: ["CV", "Transcript", "Essays", "Recommendations"],
    whyQualify: "Strong AI/ML background, Nigerian student, demonstrated leadership",
    missing: ["Proof of English proficiency"],
    sourceType: "Official",
    verified: true,
    color: "from-ash-400 to-iron-500",
  },
  {
    title: "DAAD Helmut Schmidt Programme",
    provider: "DAAD",
    matchScore: 88,
    eligibilityScore: 85,
    successProbability: 65,
    competitionLevel: "High",
    deadline: "May 1, 2026",
    funding: "€1,200/mo + Insurance",
    documents: ["CV", "Motivation Letter", "Degree Certificate", "Language Proof"],
    whyQualify: "CS degree meets requirements, public policy interest aligns",
    missing: ["German language basics", "Work experience docs"],
    sourceType: "Official",
    verified: true,
    color: "from-ash-400 to-silver-500",
  },
  {
    title: "Google AI Research Scholarship",
    provider: "Google",
    matchScore: 82,
    eligibilityScore: 78,
    successProbability: 55,
    competitionLevel: "Very High",
    deadline: "Jun 15, 2026",
    funding: "$50,000 + Research Grant",
    documents: ["Research Proposal", "CV", "Publications", "Recommendations"],
    whyQualify: "Published ML research, strong academic record",
    missing: ["First-author publication", "Specific research alignment"],
    sourceType: "Official",
    verified: true,
    color: "from-stone-400 to-stone-500",
  },
];

export function OpportunityIntelligence() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/2 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-stone-500/20 bg-stone-500/10 px-4 py-1.5 mb-4">
            <Brain className="h-3.5 w-3.5 text-stone-400" />
            <span className="text-sm font-medium text-stone-400">Opportunity Intelligence</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Intelligent <span className="text-gradient">Matching</span>
          </h2>
          <p className="text-muted-foreground/60 max-w-xl mx-auto text-sm">
            Every opportunity is analyzed with AI — match score, eligibility, competition, and actionable recommendations.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((opp, i) => (
            <motion.div
              key={opp.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group relative rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden shadow-xl hover:shadow-2xl hover:border-white/20 transition-all"
            >
              {/* Gradient top bar */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${opp.color}`} />

              <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground/90 leading-snug line-clamp-2">
                      {opp.title}
                    </h3>
                    <p className="text-sm text-muted-foreground/50 mt-1">{opp.provider}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {opp.verified && (
                      <div className="flex items-center gap-1 rounded-md bg-ash-500/10 border border-ash-500/20 px-2 py-0.5">
                        <Shield className="h-2.5 w-2.5 text-ash-400" />
                        <span className="text-[9px] font-medium text-ash-400">Verified</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5">
                      <ExternalLink className="h-2.5 w-2.5 text-muted-foreground/50" />
                      <span className="text-[9px] text-muted-foreground/50">Official</span>
                    </div>
                  </div>
                </div>

                {/* Score Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Match", value: opp.matchScore, icon: Star, color: "text-stone-400" },
                    { label: "Eligibility", value: opp.eligibilityScore, icon: Award, color: "text-ash-400" },
                    { label: "Success", value: opp.successProbability, icon: TrendingUp, color: "text-ash-400" },
                  ].map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div key={stat.label} className="rounded-lg bg-white/[0.03] border border-white/5 p-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Icon className={`h-3 w-3 ${stat.color}`} />
                          <span className={`text-sm font-bold ${stat.color}`}>{stat.value}%</span>
                        </div>
                        <p className="text-[9px] text-muted-foreground/40 mt-0.5">{stat.label}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Details */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-muted-foreground/40">Competition</span>
                    <span className="font-medium text-stone-400/80">{opp.competitionLevel}</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-muted-foreground/40">
                      <Clock className="h-2.5 w-2.5 inline mr-1" />
                      Deadline
                    </span>
                    <span className="font-medium text-foreground/60">{opp.deadline}</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-muted-foreground/40">
                      <DollarSign className="h-2.5 w-2.5 inline mr-1" />
                      Funding
                    </span>
                    <span className="font-medium text-ash-400/80">{opp.funding}</span>
                  </div>
                </div>

                {/* Required docs */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <FileText className="h-3 w-3 text-muted-foreground/40" />
                    <span className="text-[12px] font-medium text-muted-foreground/50">Required Documents</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {opp.documents.map((doc) => (
                      <span
                        key={doc}
                        className="inline-flex items-center rounded-md bg-white/5 border border-white/5 px-2 py-0.5 text-[9px] text-muted-foreground/50"
                      >
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>

                {/* AI Reasoning */}
                <div className="rounded-xl bg-primary/5 border border-primary/10 p-3 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Brain className="h-3 w-3 text-primary" />
                    <span className="text-[9px] font-semibold text-primary/70">AI Reasoning</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-3 w-3 text-ash-400 mt-0.5 shrink-0" />
                    <p className="text-[12px] text-ash-400/70">{opp.whyQualify}</p>
                  </div>
                  {opp.missing.length > 0 && (
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-3 w-3 text-stone-400 mt-0.5 shrink-0" />
                      <p className="text-[12px] text-stone-400/70">{opp.missing.join(", ")}</p>
                    </div>
                  )}
                  <div className="mt-1.5 pt-1.5 border-t border-primary/10">
                    <span className="text-[9px] font-medium text-primary/60">Recommended Action: Apply</span>
                  </div>
                </div>

                {/* Last checked */}
                <div className="text-[9px] text-muted-foreground/30 text-right">
                  Last checked: {i === 0 ? "2 min ago" : i === 1 ? "5 min ago" : "12 min ago"}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-muted-foreground/40">
            Matches based on skills, education, experience, and preferences · Updated in real time
          </p>
        </motion.div>
      </div>
    </section>
  );
}
