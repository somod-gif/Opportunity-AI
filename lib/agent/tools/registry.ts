import type { AgentTool } from "./base";

export class ToolRegistry {
  private tools = new Map<string, AgentTool>();

  register(tool: AgentTool): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): AgentTool {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool "${name}" not found. Available: ${this.list().map(t => t.name).join(", ")}`);
    }
    return tool;
  }

  list(): AgentTool[] {
    return Array.from(this.tools.values());
  }

  describe(): Array<{ name: string; description: string; parameters: string }> {
    return this.list().map((t) => ({
      name: t.name,
      description: t.description,
      parameters: JSON.stringify(t.parameters),
    }));
  }
}
