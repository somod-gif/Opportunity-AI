import type { AgentPhase, Mission, MemoryEntry } from "@/lib/types";
import type { ToolRegistry } from "./tools/registry";
import type { AIAdapter } from "./tools/base";
import { toolsToFunctionDeclarations, extractFunctionCall } from "./tools/function-calling";

export interface AgentPlan {
  phase: AgentPhase;
  reasoning: string;
  toolName?: string;
  toolParams?: Record<string, unknown>;
  missionComplete?: boolean;
  memoryUpdates?: Array<{
    key: string;
    value: string;
    type: "episodic" | "semantic" | "procedural";
    importance: number;
  }>;
}

export interface PlanContext {
  sessionId: string;
  missionId: string;
  mission: Mission;
  iteration: number;
  lastResult: string | null;
  memories: MemoryEntry[];
  tools: ToolRegistry;
  ai: AIAdapter;
}

export class AgentPlanner {
  async plan(context: PlanContext): Promise<AgentPlan> {
    const toolDescriptions = context.tools
      .describe()
      .map((t) => `- ${t.name}: ${t.description}`)
      .join("\n");

    const memories = context.memories
      .slice(0, 5)
      .map((m) => `[${m.memoryType}] ${m.key}: ${m.value.slice(0, 100)}`)
      .join("\n");

    const profileSection = [
      context.mission.education ? `Education: ${context.mission.education}` : "",
      context.mission.skills?.length ? `Skills: ${context.mission.skills.join(", ")}` : "",
      context.mission.country ? `Country: ${context.mission.country}` : "",
      context.mission.careerGoal ? `Career Goal: ${context.mission.careerGoal}` : "",
    ].filter(Boolean).join("\n");

    const prompt = `You are an autonomous AI career agent for African students.

MISSION: ${context.mission.goal}
${profileSection}

ITERATION: ${context.iteration}
${context.lastResult ? `LAST TOOL RESULT: ${context.lastResult}` : "No previous actions yet."}

RELEVANT MEMORIES:
${memories || "No memories yet."}

AVAILABLE TOOLS:
${toolDescriptions}

YOUR JOB:
You must search for opportunities, analyze them, and prepare application materials.

SEARCH STRATEGY:
1. Start by searching the database using search_scholarships / search_fellowships / etc. with the user's keywords and country
2. If DB returns 0 results, immediately call web_search to find opportunities online
3. Once you have opportunities (from DB or web), call eligibility_analyzer to check the user's fit
4. After eligibility, call gap_analysis to identify what the user is missing
5. Generate documents for the best matching opportunities

EACH ITERATION:
- Analyze what you've done so far and what remains
- Choose the single most impactful next tool
- If mission is complete, set missionComplete: true

TERMINATION CONDITIONS (all must be met):
- Searched database (at least one DB search tool)
- Searched web (web_search if DB results were 0 or insufficient)
- Analyzed eligibility for at least 2 opportunities
- Identified gaps for at least 2 opportunities
- Generated at least one document
- Stored analysis in memory

Return JSON:
{
  "phase": "perceive" | "reason" | "plan" | "tool_select" | "observe" | "complete",
  "reasoning": "Step-by-step thinking. Explain what you know, what's been done, what's missing, and why you chose the next tool. If analyzing results, explain to the user WHY they qualify or not and WHAT they can do.",
  "toolName": null | "tool_name",
  "toolParams": { ... } | null,
  "missionComplete": false,
  "memoryUpdates": [{ "key": "...", "value": "...", "type": "episodic|semantic|procedural", "importance": 0.8 }]
}

If calling eligibility_analyzer, pass the full profile data.
If calling web_search, pass a specific query based on the user's mission.`;

    let result: Partial<AgentPlan>;
    try {
      result = await context.ai.generateJSON<AgentPlan>("plan", prompt);
    } catch {
      result = { phase: "tool_select", reasoning: "Planning next action...", toolName: "search_opportunities", toolParams: { types: ["scholarship", "fellowship", "internship"], limit: 20 } };
    }
    return {
      phase: result.phase ?? "tool_select",
      reasoning: result.reasoning ?? "Planning next action...",
      toolName: result.toolName,
      toolParams: result.toolParams,
      memoryUpdates: result.memoryUpdates,
      missionComplete: result.missionComplete ?? false,
    };
  }

  async reason(context: PlanContext): Promise<string> {
    const profileSection = [
      context.mission.education ? `Education: ${context.mission.education}` : "",
      context.mission.skills?.length ? `Skills: ${context.mission.skills.join(", ")}` : "",
      context.mission.country ? `Country: ${context.mission.country}` : "",
      context.mission.careerGoal ? `Career Goal: ${context.mission.careerGoal}` : "",
    ].filter(Boolean).join("\n");

    const prompt = `Mission: ${context.mission.goal}
${profileSection}
Iteration: ${context.iteration}
${context.lastResult ? `Last tool result: ${context.lastResult}` : "No previous actions yet."}

Think step by step about the mission:
1. What do I already know about this user? (education, skills, country, career goal)
2. What have I done so far this session?
3. If I found opportunities: How well do they match the user? What requirements are missing? What can the user do to improve their chances?
4. If I found NO opportunities yet: Where should I look next? Which search tool is most appropriate?
5. What would be the single most valuable next action?

If you have enough data to analyze eligibility or gaps, mention that. If search returned empty, suggest a web search. Be specific about WHY the user would or wouldn't qualify for found opportunities.

Return your reasoning as a single detailed paragraph.`;

    return context.ai.generate(prompt);
  }

  async evaluateToolSelection(
    reasoning: string,
    tools: ToolRegistry,
    ai: AIAdapter
  ): Promise<{ tool: string; params: Record<string, unknown> }> {
    const toolList = tools.list();
    const declarations = toolsToFunctionDeclarations(toolList);

    // Try function calling first (native tool selection)
    try {
      const systemPrompt = `You are an autonomous mission planner for Opportunity AI.
Reasoning: ${reasoning}

Rules for tool selection:
- If 0 opportunities found from DB, use web_search
- If opportunities found but not analyzed, use eligibility_analyzer
- If eligibility done but no gaps checked, use gap_analysis
- If gaps done, use generate_document
- Use memory_store for important findings

Select ONE tool that makes the most progress toward the mission.`;

      const result = await (ai as unknown as {
        generateWithTools?: (
          systemPrompt: string,
          tools: { name: string; description: string; parameters: Record<string, unknown> }[],
          history: Array<{ role: "user" | "model"; text: string }>
        ) => Promise<{ functionCalls?: Array<{ name: string; args: Record<string, unknown> }> }>;
      }).generateWithTools?.(
        systemPrompt,
        declarations,
        [{ role: "user", text: reasoning }]
      );

      if (result?.functionCalls?.length) {
        const call = result.functionCalls[0];
        return { tool: call.name, params: call.args as Record<string, unknown> };
      }
    } catch {
      // function calling failed, fall through to JSON prompt
    }

    // Fallback: use generateJSON
    const toolDescriptions = tools.describe();
    const prompt = `Reasoning: ${reasoning}

Available tools:
${toolDescriptions.map((t) => `- ${t.name}: ${t.description} (params: ${t.parameters})`).join("\n")}

Choose ONE tool to call next. Rules:
- If you have found 0 opportunities from DB, use web_search
- If you have opportunities but haven't analyzed eligibility yet, use eligibility_analyzer
- If you have analyzed eligibility but haven't checked gaps, use gap_analysis
- If you have analyzed gaps, use one of the document generators

Return ONLY the tool name and its parameters as JSON:
{
  "tool": "tool_name",
  "params": {
    // All required parameters for this tool
  }
}

Make sure to include ALL required params based on the tool's specification above. For example:
- eligibility_analyzer needs: opportunityTitle, opportunityDescription, opportunityEligibility, profileEducation, profileSkills[], profileCountry
- gap_analysis needs: opportunityTitle, opportunityRequirements, profileSkills[], profileEducation
- web_search needs: query (be specific, based on the user's mission)
- document generators need: type, opportunityTitle, opportunityProvider, opportunityType, opportunityDescription, opportunityEligibility, opportunityDeadline`;

    try {
      return await ai.generateJSON<{ tool: string; params: Record<string, unknown> }>(
        "tool-select",
        prompt
      );
    } catch {
      return { tool: "search_opportunities", params: { types: ["scholarship", "fellowship", "internship"], limit: 20 } };
    }
  }
}
