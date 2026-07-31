import { z } from "zod";
import type { ToolResult } from "@/lib/types";
import type { DB } from "@/lib/db";

export type { ToolResult };

export interface AIAdapter {
  generateJSON<T>(capability: string, prompt: string, signal?: AbortSignal): Promise<T>;
  generate(prompt: string): Promise<string>;
}

export interface ToolContext {
  sessionId: string;
  missionId: string;
  db: DB;
  ai: AIAdapter;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: z.ZodTypeAny;
  execute(params: unknown, ctx: ToolContext): Promise<ToolResult>;
}
