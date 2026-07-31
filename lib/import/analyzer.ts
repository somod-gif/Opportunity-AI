import { db } from "@/lib/db";
import { opportunities, applications, reminders, agentMemories, importAnalyses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { SSEEmitter } from "@/lib/agent/emit";
import { ToolRegistry } from "@/lib/agent/tools/registry";
import { ToolDispatcher } from "@/lib/agent/dispatcher";
import { webSearchTool } from "@/lib/agent/tools/web";
import type { AgentTool, AIAdapter } from "@/lib/agent/tools/base";
import type {
  ImportInput,
  ImportReport,
  ExtractedOpportunity,
  EvaluationResult,
  GapAnalysisResult,
  StrategyResult,
  SimilarOpportunity,
} from "./types";

const VALID_TYPES = [
  "scholarship",
  "fellowship",
  "job",
  "internship",
  "grant",
  "accelerator",
  "competition",
  "conference",
  "research",
  "hackathon",
] as const;

function normalizeType(t: string | null | undefined): string {
  if (!t) return "scholarship";
  const lower = t.toLowerCase().trim();
  if (VALID_TYPES.includes(lower as (typeof VALID_TYPES)[number])) return lower;
  if (lower.includes("scholar") || lower.includes("fund") || lower.includes("bursary")) return "scholarship";
  if (lower.includes("fellow")) return "fellowship";
  if (lower.includes("intern")) return "internship";
  if (lower.includes("grant")) return "grant";
  if (lower.includes("accelerator") || lower.includes("incubator")) return "accelerator";
  if (lower.includes("competition") || lower.includes("prize") || lower.includes("award")) return "competition";
  if (lower.includes("conference")) return "conference";
  if (lower.includes("research")) return "research";
  if (lower.includes("hackathon")) return "hackathon";
  if (lower.includes("job") || lower.includes("role") || lower.includes("position")) return "job";
  return "scholarship";
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function withTimeout<T>(factory: (signal: AbortSignal) => Promise<T>, ms: number, fallback: T): Promise<T> {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return Promise.race([
    factory(controller.signal),
    new Promise<T>((resolve) => {
      timeoutId = setTimeout(() => {
        controller.abort();
        resolve(fallback);
      }, ms);
    }),
  ]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

function htmlToText(html: string): string {
  const removed = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
  return removed.replace(/\s+/g, " ").trim();
}

async function scrapeUrl(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; OpportunityAI/1.0; +opportunity-ai.vercel.app)" },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const contentType = res.headers.get("content-type") || "";
    const raw = await res.text();
    if (contentType.includes("application/pdf")) return `PDF document: ${raw.slice(0, 2000)}`;
    const text = htmlToText(raw);
    return text.slice(0, 12000);
  } finally {
    clearTimeout(timeoutId);
  }
}

export class ImportAnalyzer {
  private startTime = Date.now();
  private maxDuration = 230_000;

  constructor(
    private sessionId: string,
    private input: ImportInput,
    private emitter: SSEEmitter,
    private meta: { deviceId?: string } = {}
  ) {}

  private remaining(): number {
    return Math.max(8000, this.maxDuration - (Date.now() - this.startTime));
  }

  private async getAI(): Promise<AIAdapter> {
    const { getProvider } = await import("@/lib/ai/registry");
    const provider = getProvider();
    return {
      generateJSON: <T>(capability: string, prompt: string) =>
        provider.generateJSON(capability as never, prompt) as Promise<T>,
      generate: (prompt: string) => provider.generate(prompt),
    };
  }

  private profileContext(): string {
    const p = this.input.profile;
    const parts: string[] = [];
    if (p.education) parts.push(`Education: ${p.education}`);
    if (p.skills?.length) parts.push(`Skills: ${p.skills.join(", ")}`);
    if (p.country) parts.push(`Country: ${p.country}`);
    if (p.careerGoal) parts.push(`Career goal: ${p.careerGoal}`);
    if (p.experienceLevel) parts.push(`Experience level: ${p.experienceLevel}`);
    return parts.length ? parts.join("\n") : "No profile details provided.";
  }

  async run(): Promise<ImportReport> {
    const emitter = this.emitter;
    const ai = await this.getAI();
    const analysisId = this.sessionId;
    const deadline = Date.now() + this.maxDuration;
    const timeLeft = () => Math.max(0, deadline - Date.now());

    emitter.emit({ type: "phase", data: { phase: "perceive", iteration: 1 } });

    await db.insert(importAnalyses).values({
      sessionId: this.sessionId,
      deviceId: this.meta.deviceId ?? null,
      sourceUrl: this.input.url ?? null,
      rawText: this.input.text?.slice(0, 12000) ?? null,
      status: "running",
    });

    // ── Step 1: Scrape ─────────────────────────────────────────────
    let sourceText = this.input.text?.trim() || "";
    if (this.input.url) {
      emitter.emit({ type: "phase", data: { phase: "tool_execute", iteration: 1 } });
      emitter.emit({ type: "tool_call", data: { tool: "web_scrape", params: { url: this.input.url } } });
      emitter.emit({ type: "thought", data: { content: `Fetching ${this.input.url} to extract the opportunity details.` } });
      try {
        sourceText = await withTimeout(() => scrapeUrl(this.input.url!), 18000, "");
        if (sourceText) {
          emitter.emit({
            type: "tool_result",
            data: { tool: "web_scrape", result: { success: true, summary: `Retrieved ${sourceText.length.toLocaleString()} characters from the page`, metadata: { sourceUrl: this.input.url, chars: sourceText.length } } },
          });
        } else {
          emitter.emit({ type: "tool_result", data: { tool: "web_scrape", result: { success: false, summary: "Could not fetch the page — falling back to provided text" } } });
        }
      } catch {
        emitter.emit({ type: "tool_result", data: { tool: "web_scrape", result: { success: false, summary: "Could not fetch the page — falling back to provided text" } } });
      }
    }

    if (!sourceText.trim()) {
      await db.update(importAnalyses).set({ status: "failed", updatedAt: new Date() }).where(eq(importAnalyses.sessionId, analysisId));
      emitter.emitError("No source content provided. Add a URL or paste the opportunity text.");
      return {
        status: "failed",
        sourceUrl: this.input.url ?? null,
        fitScore: 0,
        verdict: "unavailable",
        opportunityId: "",
        slug: "",
        extraction: { title: "", provider: "", type: "scholarship", description: "", eligibilityCriteria: "", benefits: null, applicationUrl: null, deadline: null, deadlineText: null, location: null, isRemote: false, targetAudience: [], requiredSkills: [], preferredSkills: [], experienceLevel: null, tags: [], fundingDetails: null },
        evaluation: { fitScore: 0, verdict: "unlikely", summary: "", reasons: [], eligibilityChecklist: [] },
        gapAnalysis: { skillGaps: [], learningRoadmap: [], estimatedPrepWeeks: 0 },
        research: [],
        strategy: { overview: "", timeline: [], documentsNeeded: [], checklist: [], riskFactors: [] },
        nextSteps: [],
        duration: 0,
        completedAt: new Date().toISOString(),
      };
    }

    // ── Step 2: Extract ────────────────────────────────────────────
    emitter.emit({ type: "phase", data: { phase: "reason", iteration: 1 } });
    emitter.emit({ type: "thought", data: { content: "Structuring the source into a normalized opportunity profile — title, eligibility, deadline, funding." } });
    let extraction: ExtractedOpportunity;
    try {
      extraction = await withTimeout(
        (signal) => ai.generateJSON<ExtractedOpportunity>(
          "opportunity-matching",
          `You are an expert opportunity analyst. Extract structured data about an opportunity from the source text below.

SOURCE TEXT:
"""
${sourceText.slice(0, 8000)}
"""

Return ONLY valid JSON with exactly these fields:
{
  "title": "string - opportunity name",
  "provider": "string - organization offering it",
  "type": "string - one of: scholarship, fellowship, job, internship, grant, accelerator, competition, conference, research, hackathon",
  "description": "string - 3-4 sentence overview",
  "eligibilityCriteria": "string - full eligibility requirements",
  "benefits": "string | null - what's included (funding, stipend, coverage)",
  "applicationUrl": "string | null - official application link if present in text",
  "deadline": "string | null - ISO date (YYYY-MM-DD) if stated, else null",
  "deadlineText": "string | null - deadline as written in the text, else null",
  "location": "string | null - e.g. 'Germany', 'Remote', 'Multiple'",
  "isRemote": "boolean",
  "targetAudience": ["string - who can apply, e.g. 'African nationals'"],
  "requiredSkills": ["string"],
  "preferredSkills": ["string"],
  "experienceLevel": "string | null - one of entry, mid, senior, lead, executive",
  "tags": ["string - 3-6 short tags"],
  "fundingDetails": "string | null - money amount/coverage details"
}`
        ),
        Math.min(timeLeft() * 0.3, 50000),
        null as unknown as ExtractedOpportunity
      );
      if (!extraction || !extraction.title) throw new Error("empty");
    } catch (e) {
      console.warn("[import] extract step failed:", e instanceof Error ? e.message : e);
      extraction = {
        title: this.input.url ? `Imported Opportunity (${new URL(this.input.url).hostname})` : "Imported Opportunity",
        provider: "Imported",
        type: "scholarship",
        description: sourceText.slice(0, 500),
        eligibilityCriteria: "Check the source listing for full eligibility details.",
        benefits: null,
        applicationUrl: this.input.url ?? null,
        deadline: null,
        deadlineText: null,
        location: null,
        isRemote: false,
        targetAudience: [],
        requiredSkills: [],
        preferredSkills: [],
        experienceLevel: null,
        tags: ["imported"],
        fundingDetails: null,
      };
    }
    extraction.type = normalizeType(extraction.type);
    emitter.emit({ type: "tool_result", data: { tool: "ai_extract", result: { success: true, summary: `Extracted "${extraction.title}" by ${extraction.provider}`, metadata: { title: extraction.title, provider: extraction.provider, type: extraction.type } } } });

    // ── Step 3: Evaluate eligibility ───────────────────────────────
    emitter.emit({ type: "phase", data: { phase: "plan", iteration: 1 } });
    emitter.emit({ type: "thought", data: { content: "Scoring your fit against every eligibility criterion." } });
    let evaluation: EvaluationResult;
    try {
      evaluation = await withTimeout(
        (signal) => ai.generateJSON<EvaluationResult>(
          "eligibility-analysis",
          `You are an admissions advisor evaluating a candidate's fit for an opportunity.

OPPORTUNITY:
Title: ${extraction.title}
Provider: ${extraction.provider}
Type: ${extraction.type}
Eligibility: ${extraction.eligibilityCriteria}
Target audience: ${extraction.targetAudience.join(", ") || "unspecified"}
Required skills: ${extraction.requiredSkills.join(", ") || "unspecified"}
Experience level: ${extraction.experienceLevel || "unspecified"}

CANDIDATE PROFILE:
${this.profileContext()}

Return ONLY valid JSON with exactly:
{
  "fitScore": "number 0-100",
  "verdict": "string - one of: strong, possible, unlikely",
  "summary": "string - 2-3 sentences explaining the verdict",
  "reasons": ["string - 3-5 concrete reasons"],
  "eligibilityChecklist": [{"item": "string", "met": "boolean", "note": "string"}]
}`
        ),
        Math.min(timeLeft() * 0.35, 40000),
        null as unknown as EvaluationResult
      );
      if (!evaluation || typeof evaluation.fitScore !== "number") throw new Error("empty");
      evaluation.verdict = evaluation.fitScore >= 65 ? "strong" : evaluation.fitScore >= 40 ? "possible" : "unlikely";
    } catch (e) {
      console.warn("[import] evaluate step failed:", e instanceof Error ? e.message : e);
      evaluation = { fitScore: 50, verdict: "possible", summary: "Automatic analysis could not be completed — review the eligibility criteria manually.", reasons: [], eligibilityChecklist: [] };
    }
    emitter.emit({ type: "tool_result", data: { tool: "ai_evaluate", result: { success: true, summary: `Fit score ${evaluation.fitScore}/100 — ${evaluation.verdict}`, metadata: { fitScore: evaluation.fitScore, verdict: evaluation.verdict } } } });

    // ── Step 4: Gap analysis + learning roadmap ───────────────────
    emitter.emit({ type: "phase", data: { phase: "reason", iteration: 2 } });
    emitter.emit({ type: "thought", data: { content: "Identifying your skill gaps and building a learning roadmap to close them." } });
    let gap: GapAnalysisResult;
    try {
      gap = await withTimeout(
        (signal) => ai.generateJSON<GapAnalysisResult>(
          "roadmap-generation",
          `You are a career coach. Analyze the gap between the candidate and this opportunity.

CANDIDATE PROFILE:
${this.profileContext()}

OPPORTUNITY:
Title: ${extraction.title}
Type: ${extraction.type}
Required skills: ${extraction.requiredSkills.join(", ") || "unspecified"}
Preferred skills: ${extraction.preferredSkills.join(", ") || "unspecified"}
Target audience: ${extraction.targetAudience.join(", ") || "unspecified"}

Return ONLY valid JSON with exactly:
{
  "skillGaps": [{"skill": "string", "priority": "string - high|medium|low", "effortWeeks": "number"}],
  "learningRoadmap": [{"phase": "string - e.g. 'Phase 1: Foundations'", "focus": "string - what to learn", "resources": ["string - 2-3 free resources"]}],
  "estimatedPrepWeeks": "number - total estimated weeks to become competitive"
}`
        ),
        Math.min(timeLeft() * 0.4, 40000),
        null as unknown as GapAnalysisResult
      );
      if (!gap || !Array.isArray(gap.skillGaps)) throw new Error("empty");
    } catch (e) {
      console.warn("[import] gap step failed:", e instanceof Error ? e.message : e);
      gap = { skillGaps: [], learningRoadmap: [], estimatedPrepWeeks: 4 };
    }
    emitter.emit({ type: "tool_result", data: { tool: "gap_analysis", result: { success: true, summary: `Identified ${gap.skillGaps.length} skill gaps — ${gap.estimatedPrepWeeks} weeks estimated prep time`, metadata: { gaps: gap.skillGaps.length, weeks: gap.estimatedPrepWeeks } } } });

    // ── Step 5: Application strategy ───────────────────────────────
    emitter.emit({ type: "phase", data: { phase: "plan", iteration: 2 } });
    emitter.emit({ type: "thought", data: { content: "Building a week-by-week application strategy and checklist." } });
    let strategy: StrategyResult;
    try {
      strategy = await withTimeout(
        (signal) => ai.generateJSON<StrategyResult>(
          "plan",
          `You are an application strategist. Build a concrete application plan.

OPPORTUNITY:
Title: ${extraction.title}
Provider: ${extraction.provider}
Deadline: ${extraction.deadlineText || extraction.deadline || "not stated"}
Required: ${extraction.eligibilityCriteria.slice(0, 600)}
Funding: ${extraction.fundingDetails || "not stated"}

CANDIDATE:
${this.profileContext()}
Estimated prep time: ${gap.estimatedPrepWeeks} weeks

Return ONLY valid JSON with exactly:
{
  "overview": "string - 2-3 sentence strategy",
  "timeline": [{"week": "string - e.g. 'Week 1-2'", "action": "string", "detail": "string"}],
  "documentsNeeded": ["string - e.g. 'Transcript'"],
  "checklist": ["string - 6-10 concrete pre-submission checklist items"],
  "riskFactors": ["string - 2-3 risks and mitigations"]
}`
        ),
        Math.min(timeLeft() * 0.45, 60000),
        null as unknown as StrategyResult
      );
      if (!strategy || !Array.isArray(strategy.timeline)) throw new Error("empty");
    } catch (e) {
      console.warn("[import] strategy step failed:", e instanceof Error ? e.message : e);
      strategy = { overview: "Review the opportunity page for exact requirements, then prepare the documents listed below.", timeline: [], documentsNeeded: ["CV", "Transcript", "Motivation letter"], checklist: ["Read the full eligibility criteria", "Prepare documents", "Draft application", "Submit before deadline"], riskFactors: [] };
    }
    emitter.emit({ type: "tool_result", data: { tool: "ai_strategy", result: { success: true, summary: `Built a ${strategy.timeline.length}-step application strategy`, metadata: { steps: strategy.timeline.length } } } });

    // ── Step 6: Research similar opportunities ─────────────────────
    emitter.emit({ type: "phase", data: { phase: "tool_select", iteration: 2 } });
    emitter.emit({ type: "thought", data: { content: `Researching similar ${extraction.type}s as backup options.` } });
    let research: SimilarOpportunity[] = [];
    try {
      const registry = new ToolRegistry();
      registry.register(webSearchTool as AgentTool);
      const dispatcher = new ToolDispatcher(registry);
      emitter.emit({ type: "tool_call", data: { tool: "web_search", params: { query: `${extraction.title} ${extraction.provider} similar ${extraction.type} opportunities`, maxResults: 3 } } });
      const result = await withTimeout(
        () => dispatcher.dispatch({
          name: "web_search",
          params: { query: `${extraction.title} ${extraction.provider} similar ${extraction.type} opportunities for African students`, maxResults: 3 },
          status: "pending",
        }, {
          sessionId: this.sessionId,
          missionId: analysisId,
          db,
          ai,
        }),
        30000,
        null as unknown as Awaited<ReturnType<ToolDispatcher["dispatch"]>>
      );
      const data = (result?.data as Array<{ title?: string; provider?: string; type?: string; description?: string; applicationUrl?: string }>) || [];
      research = data.slice(0, 3).map((r) => ({
        title: r.title || "Related opportunity",
        provider: r.provider || "Web",
        type: normalizeType(r.type),
        description: r.description || "",
        applicationUrl: r.applicationUrl || "https://duckduckgo.com/",
      }));
      emitter.emit({ type: "tool_result", data: { tool: "web_search", result: { success: true, summary: `Found ${research.length} similar opportunities`, metadata: { count: research.length } } } });
    } catch {
      research = [];
    }

    // ── Step 7: Persist ────────────────────────────────────────────
    emitter.emit({ type: "phase", data: { phase: "memory", iteration: 2 } });
    emitter.emit({ type: "thought", data: { content: "Persisting the opportunity, tracker entry, reminder, and memories." } });

    let baseSlug = slugify(extraction.title) || `imported-${analysisId.slice(0, 8)}`;
    let slug = baseSlug;
    for (let i = 1; ; i++) {
      const existing = await db.select({ id: opportunities.id }).from(opportunities).where(eq(opportunities.slug, slug)).limit(1);
      if (existing.length === 0) break;
      slug = `${baseSlug.slice(0, 52)}-${i}`;
    }

    const deadlineDate = extraction.deadline ? new Date(extraction.deadline) : null;
    const oppInsert = await db.insert(opportunities).values({
      title: extraction.title,
      slug,
      type: extraction.type as never,
      provider: extraction.provider,
      description: extraction.description,
      eligibilityCriteria: extraction.eligibilityCriteria,
      benefits: extraction.benefits,
      applicationUrl: extraction.applicationUrl,
      deadline: deadlineDate,
      location: extraction.location,
      isRemote: extraction.isRemote,
      targetAudience: extraction.targetAudience,
      requiredSkills: extraction.requiredSkills,
      preferredSkills: extraction.preferredSkills,
      experienceLevel: extraction.experienceLevel,
      tags: extraction.tags,
      isActive: true,
    }).returning({ id: opportunities.id });
    const opportunityId = oppInsert[0]?.id ?? null;

    if (opportunityId) {
      await db.insert(applications).values({
        sessionId: this.sessionId,
        opportunityId,
        status: "saved",
        deadline: deadlineDate,
        notes: `Imported for analysis. Fit score ${evaluation.fitScore}/100 — ${evaluation.verdict}.`,
      });

      const email = this.input.profile.email;
      if (deadlineDate && email) {
        await db.insert(reminders).values({
          sessionId: this.sessionId,
          opportunityId,
          type: "deadline",
          message: `Deadline approaching: ${extraction.title} closes ${extraction.deadlineText || deadlineDate.toISOString().slice(0, 10)}`,
          dueAt: deadlineDate,
        });
      }

      const memories: Array<{ memoryType: "episodic" | "semantic" | "procedural"; key: string; value: string; importance: number }> = [
        { memoryType: "semantic", key: `opportunity:${slug}`, value: `${extraction.title} (${extraction.provider}) — fit score ${evaluation.fitScore}/100, ${evaluation.verdict}. Type: ${extraction.type}.`, importance: 0.85 },
        { memoryType: "episodic", key: `import_analysis_${analysisId}`, value: `Analyzed "${extraction.title}" from ${this.input.url || "pasted text"}. Verdict: ${evaluation.verdict}.`, importance: 0.7 },
        { memoryType: "procedural", key: `strategy_${slug}`, value: `Application plan: ${strategy.timeline.length} steps over ~${gap.estimatedPrepWeeks} weeks. Checklist: ${strategy.checklist.slice(0, 3).join("; ")}.`, importance: 0.75 },
      ];
      for (const m of memories) {
        await db.insert(agentMemories).values({ sessionId: this.sessionId, memoryType: m.memoryType, key: m.key, value: m.value, importance: m.importance });
      }
      emitter.emit({ type: "memory", data: { memories: memories.map((m) => ({ key: m.key, type: m.memoryType, importance: m.importance })) } });
    }

    // ── Finalize ───────────────────────────────────────────────────
    const nextSteps = strategy.timeline.slice(0, 3).map((s) => s.action);
    const report: ImportReport = {
      status: "complete",
      sourceUrl: this.input.url ?? null,
      fitScore: evaluation.fitScore,
      verdict: evaluation.verdict,
      opportunityId: opportunityId ?? "",
      slug,
      extraction,
      evaluation,
      gapAnalysis: gap,
      research,
      strategy,
      nextSteps: nextSteps.length ? nextSteps : ["Review the opportunity page", "Prepare your documents", "Submit the application"],
      duration: Math.round((Date.now() - this.startTime) / 1000),
      completedAt: new Date().toISOString(),
    };

    await db.update(importAnalyses)
      .set({
        status: "complete",
        opportunityId,
        extraction,
        evaluation,
        gapAnalysis: gap,
        research,
        strategy,
        report: report as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      })
      .where(eq(importAnalyses.sessionId, analysisId));

    emitter.emit({ type: "phase", data: { phase: "complete", iteration: 2 } });
    emitter.emit({ type: "complete", data: { summary: `Analysis complete — fit score ${evaluation.fitScore}/100`, report } });
    return report;
  }
}
