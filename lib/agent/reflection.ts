import type { AgentPhase, ToolResult, MemoryEntry } from "@/lib/types";

export interface ReflectionResult {
  observations: string;
  missionComplete: boolean;
  remainingGaps: string[];
  nextAction: string;
  memoryUpdates: Array<{
    key: string;
    value: string;
    type: "episodic" | "semantic" | "procedural";
    importance: number;
  }>;
}

export class AgentReflector {
  async reflect(
    phase: AgentPhase,
    reasoning: string,
    toolResult: ToolResult | null,
    recentMemories: MemoryEntry[],
    missionGoal: string,
    ai: {
      generateJSON<T>(capability: string, prompt: string): Promise<T>;
    }
  ): Promise<ReflectionResult> {
    const hasResults = toolResult?.success && toolResult?.data && Array.isArray(toolResult.data) && toolResult.data.length > 0;
    const resultCount = hasResults ? (toolResult!.data as unknown[]).length : 0;

    const prompt = `Phase: ${phase}
Reasoning: ${reasoning}
Tool result: ${toolResult ? JSON.stringify(toolResult).slice(0, 2000) : "No tool result"}
Mission: ${missionGoal}

Recent memories: ${recentMemories
  .slice(0, 5)
  .map((m) => `[${m.memoryType}] ${m.key}`)
  .join(", ")}

INSTRUCTIONS:
1. Analyze what this tool result tells us about the user's mission progress
2. ${hasResults ? `We found ${resultCount} opportunities. Check if eligibility has been analyzed. If not, note that we need to call eligibility_analyzer next.` : "We found 0 results. The next step should be web_search to find more opportunities online."}
3. Determine if the mission is complete (must have ALL of: searched DB, searched web, analyzed eligibility, identified gaps, generated document, stored in memory)
4. Generate user-facing observations explaining what was found and what it means

CRITICAL: In your observations, explain to the user in clear language:
- What was found or not found
- WHY they qualify/don't qualify for specific opportunities
- WHAT specific skills or requirements they need to work on
- HOW they can improve (specific courses, projects, certifications)
- WHICH opportunities are the best match and why

Return JSON:
{
  "observations": "Clear, user-friendly summary explaining what was learned and what it means for the user. Include specific details about their fit/gaps.",
  "missionComplete": false,
  "remainingGaps": ["specific gap 1", "specific gap 2"],
  "nextAction": "Specific next action to take",
  "memoryUpdates": [{ "key": "...", "value": "...", "type": "episodic|semantic|procedural", "importance": 0.8 }]
}

IMPORTANT: Never set missionComplete: true unless ALL of these are done: searched DB, searched web, analyzed eligibility for at least 2 opportunities, identified gaps for at least 2 opportunities, generated at least one document.`;

    try {
      return await ai.generateJSON<ReflectionResult>("reflect", prompt);
    } catch {
      return {
        observations: `Processed tool output. ${hasResults ? `Found ${resultCount} results.` : "No results found."}`,
        missionComplete: false,
        remainingGaps: ["Continue searching for matching opportunities"],
        nextAction: hasResults ? "analyze_eligibility" : "web_search",
        memoryUpdates: [{ key: `search:iteration-${Date.now()}`, value: hasResults ? `Found ${resultCount} opportunities` : "No results found", type: "episodic", importance: 0.5 }],
      };
    }
  }
}
