import type { AgentTool } from "./base";
import type { FunctionDeclaration, FunctionCall } from "@/lib/ai/provider";

function zodToJsonSchema(zodObj: { describe: () => { type?: string; fields?: Record<string, unknown> } }): Record<string, unknown> {
  const desc = zodObj.describe();
  if (desc.type === "object" && desc.fields) {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    for (const [key, field] of Object.entries(desc.fields)) {
      const f = field as { type?: string; optional?: boolean; description?: string; innerType?: { type?: string } };
      properties[key] = {
        type: f.type || "string",
        description: f.description || "",
      };
      if ((f as { required?: boolean }).required) {
        required.push(key);
      }
    }
    return { type: "object", properties, required };
  }
  return { type: "object", properties: {} };
}

export function toolsToFunctionDeclarations(tools: AgentTool[]): FunctionDeclaration[] {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    parameters: zodToJsonSchema(t.parameters as unknown as { describe: () => { type?: string; fields?: Record<string, unknown> } }),
  }));
}

export function extractFunctionCall(functionCalls: FunctionCall[] | undefined): { tool: string; params: Record<string, unknown> } | null {
  if (!functionCalls || functionCalls.length === 0) return null;
  const call = functionCalls[0];
  return { tool: call.name, params: call.args as Record<string, unknown> };
}
