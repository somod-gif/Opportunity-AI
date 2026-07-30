import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ToolRegistry } from "@/lib/agent/tools/registry";
import { searchOpportunitiesTool } from "@/lib/agent/tools/search-all";
import { webSearchTool } from "@/lib/agent/tools/web";
import { eligibilityAnalyzerTool } from "@/lib/agent/tools/eligibility-analyzer";
import { z } from "zod";

void describe("ToolRegistry", () => {
  void it("registers and retrieves tools by name", () => {
    const registry = new ToolRegistry();
    registry.register(searchOpportunitiesTool);
    registry.register(webSearchTool);

    const retrieved = registry.get("search_opportunities");
    assert.equal(retrieved.name, "search_opportunities");
    assert.equal(retrieved.description.length > 0, true);
  });

  void it("lists all registered tools", () => {
    const registry = new ToolRegistry();
    registry.register(searchOpportunitiesTool);
    registry.register(webSearchTool);

    const tools = registry.list();
    assert.equal(tools.length, 2);
    assert.equal(tools[0].name, "search_opportunities");
    assert.equal(tools[1].name, "web_search");
  });

  void it("describes tools for LLM consumption", () => {
    const registry = new ToolRegistry();
    registry.register(searchOpportunitiesTool);

    const desc = registry.describe();
    assert.equal(desc.length, 1);
    assert.equal(desc[0].name, "search_opportunities");
    assert.ok(desc[0].description.includes("search"));
  });

  void it("throws on unknown tool name", () => {
    const registry = new ToolRegistry();
    assert.throws(() => registry.get("nonexistent"), /Tool.*not found/);
  });

  void it("validates tool parameters with Zod schema", () => {
    const schema = z.object({
      query: z.string().min(1),
      maxResults: z.number().min(1).max(20).optional(),
    });

    const valid = schema.safeParse({ query: "AI scholarships", maxResults: 5 });
    assert.equal(valid.success, true);

    const invalid = schema.safeParse({ query: "" });
    assert.equal(invalid.success, false);
  });
});
