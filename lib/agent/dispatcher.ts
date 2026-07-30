import type { ToolCall, ToolResult } from "@/lib/types";
import type { ToolRegistry } from "./tools/registry";
import type { ToolContext } from "./tools/base";
import { ToolError } from "@/lib/errors";

export class ToolDispatcher {
  constructor(private registry: ToolRegistry) {}

  async dispatch(call: ToolCall, ctx: ToolContext): Promise<ToolResult> {
    const tool = this.registry.get(call.name);
    if (!tool) {
      throw new ToolError(`Tool "${call.name}" not found in registry`, "TOOL_NOT_FOUND");
    }

    try {
      const parsed = tool.parameters.parse(call.params);
      const result = await tool.execute(parsed, ctx);
      return {
        success: result.success,
        data: result.data,
        summary: result.summary,
        metadata: result.metadata,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        data: null,
        summary: `Tool "${call.name}" failed: ${message}`,
        error: message,
      };
    }
  }

  async dispatchWithRetry(
    call: ToolCall,
    ctx: ToolContext,
    maxRetries = 2
  ): Promise<ToolResult> {
    let lastError: string | undefined;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
      const result = await this.dispatch(call, ctx);
      if (result.success) return result;
      lastError = result.error;
    }
    return {
      success: false,
      data: null,
      summary: `Tool "${call.name}" failed after ${maxRetries + 1} attempts`,
      error: lastError,
    };
  }
}
