import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { AgentPlanner, type PlanContext } from "@/lib/agent/planner";
import { ToolRegistry } from "@/lib/agent/tools/registry";
import { searchOpportunitiesTool } from "@/lib/agent/tools/search-all";
import { webSearchTool } from "@/lib/agent/tools/web";
import type { AIAdapter } from "@/lib/agent/tools/base";
import type { Mission } from "@/lib/types";

void describe("AgentPlanner", () => {
  let planner: AgentPlanner;
  let tools: ToolRegistry;
  let ai: AIAdapter;
  let mission: Mission;

  before(() => {
    planner = new AgentPlanner();
    tools = new ToolRegistry();
    tools.register(searchOpportunitiesTool);
    tools.register(webSearchTool);

    ai = {
      generateJSON: async <T>(_capability: string, _prompt: string) => {
        return { phase: "tool_select", reasoning: "Test reasoning", toolName: "search_opportunities", toolParams: { types: ["scholarship"], limit: 10 }, missionComplete: false } as T;
      },
      generate: async (_prompt: string) => "Test reasoning output with step-by-step analysis.",
    };

    mission = {
      goal: "Find AI scholarships for Nigerian students",
      education: "BSc Computer Science",
      skills: ["Python", "Machine Learning"],
      country: "Nigeria",
      careerGoal: "AI Researcher",
    };
  });

  void it("generates reasoning from mission context", async () => {
    const ctx: PlanContext = {
      sessionId: "test",
      missionId: "test",
      mission,
      iteration: 1,
      lastResult: null,
      memories: [],
      tools,
      ai,
    };
    const reasoning = await planner.reason(ctx);
    assert.ok(typeof reasoning === "string");
    assert.ok(reasoning.length > 10);
  });

  void it("plans next actions with mission context", async () => {
    const ctx: PlanContext = {
      sessionId: "test",
      missionId: "test",
      mission,
      iteration: 1,
      lastResult: null,
      memories: [],
      tools,
      ai,
    };
    const plan = await planner.plan(ctx);
    assert.equal(typeof plan.phase, "string");
    assert.equal(typeof plan.reasoning, "string");
    assert.equal(typeof plan.missionComplete, "boolean");
  });

  void it("evaluates tool selection from reasoning", async () => {
    const selection = await planner.evaluateToolSelection("We need to find AI scholarships for a Nigerian student. Let's search the database first.", tools, ai);
    assert.equal(typeof selection.tool, "string");
    assert.equal(typeof selection.params, "object");
  });
});
