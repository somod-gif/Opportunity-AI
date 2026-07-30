import { db } from "@/lib/db";
import { opportunities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { AnalysisInput, MatchResult, ApplicationRoadmap, GeneratedDocument } from "./prompts";

export interface AgentResult {
  matches: MatchResult[];
  roadmap: ApplicationRoadmap | null;
  documents: Record<string, GeneratedDocument>;
  log: ReasoningStep[];
}

export interface ReasoningStep {
  icon: string;
  text: string;
}

export class CareerAgent {
  private input: AnalysisInput;
  private log: ReasoningStep[] = [];

  constructor(input: AnalysisInput) {
    this.input = input;
  }

  private addLog(text: string) {
    this.log.push({ icon: "→", text });
  }

  async run(): Promise<AgentResult> {
    const { ai } = await import("./client");

    const result: AgentResult = {
      matches: [],
      roadmap: null,
      documents: {},
      log: [],
    };

    this.addLog(`Reading profile: ${this.input.education}, ${this.input.skills.join(", ")}, from ${this.input.country}`);

    // Step 1: Analyze profile via AI
    this.addLog("Understanding career goals and background");
    const analysis = await ai.analyzeProfile(this.input);
    this.addLog(`Profile analyzed — ${analysis.careerStage} with strengths in ${analysis.strengths.slice(0, 2).join(", ")}`);

    // Step 2: Match opportunities
    this.addLog("Searching for relevant African opportunities");
    const allOpps = await db
      .select({
        title: opportunities.title,
        type: opportunities.type,
        provider: opportunities.provider,
        description: opportunities.description,
        eligibilityCriteria: opportunities.eligibilityCriteria,
        requiredSkills: opportunities.requiredSkills,
        preferredSkills: opportunities.preferredSkills,
        deadline: opportunities.deadline,
        tags: opportunities.tags,
      })
      .from(opportunities)
      .where(eq(opportunities.isActive, true));

    this.addLog(`Found ${allOpps.length} available opportunities`);
    this.addLog("Evaluating eligibility and calculating match scores");

    const matches = await ai.matchOpportunities(
      this.input,
      analysis,
      allOpps.map((o) => ({ ...o, deadline: o.deadline ? o.deadline.toISOString() : null }))
    );

    if (matches.length === 0) {
      this.addLog("No qualifying opportunities found");
      result.log = this.log;
      return result;
    }

    result.matches = matches;
    this.addLog(`Ranked ${matches.length} matches — top match: ${matches[0].title} (${matches[0].matchScore}% match)`);
    this.addLog(`Eligibility reasoning: ${matches[0].whyYouQualify[0] || "Good profile fit"}`);

    // Step 3: Generate for top match
    const top = matches[0];

    this.addLog("Generating step-by-step application roadmap");
    const opp = await db
      .select({
        title: opportunities.title,
        provider: opportunities.provider,
        type: opportunities.type,
        description: opportunities.description,
        eligibilityCriteria: opportunities.eligibilityCriteria,
        deadline: opportunities.deadline,
      })
      .from(opportunities)
      .where(eq(opportunities.isActive, true))
      .then((rows) => rows.find((o) => o.title === top.title));

    if (opp) {
      const oppData = { ...opp, deadline: opp.deadline ? opp.deadline.toISOString() : null };
      result.roadmap = await ai.generateRoadmap(
        this.input, oppData,
        { whyYouQualify: top.whyYouQualify, gaps: top.gaps, nextSteps: top.nextSteps }
      );
      this.addLog(`Roadmap created with ${result.roadmap.steps.length} steps`);

      this.addLog("Writing personalized cover letter");
      result.documents["cover-letter"] = await ai.generateDocument("cover-letter", this.input, oppData);
      this.addLog("Cover letter generated");

      this.addLog("Drafting personal statement");
      result.documents["personal-statement"] = await ai.generateDocument("personal-statement", this.input, oppData);
      this.addLog("Personal statement drafted");

      this.addLog("Generating resume suggestions");
      result.documents["resume"] = await ai.generateDocument("resume", this.input, oppData);
      this.addLog("Resume suggestions ready");

      this.addLog("Building application checklist");
      result.documents["checklist"] = await ai.generateDocument("checklist", this.input, oppData);
      this.addLog("Application checklist complete");
    }

    this.addLog(`✅ Finished — ${matches.length} opportunities analyzed, complete application package ready for ${top.title}`);
    result.log = this.log;
    return result;
  }
}
