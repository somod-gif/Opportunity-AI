export type AICapability =
  | "profile-analysis"
  | "skill-extraction"
  | "opportunity-matching"
  | "eligibility-analysis"
  | "roadmap-generation"
  | "document-generation"
  | "plan"
  | "tool-select"
  | "reflect"
  | "reason"
  | "memory-update";

export interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface FunctionCall {
  name: string;
  args: Record<string, unknown>;
}

export interface ToolConfig {
  function_calling_config: {
    mode: "auto" | "any" | "none";
    allowed_function_names?: string[];
  };
}

export interface AIProvider {
  readonly name: string;
  generateJSON<T>(capability: AICapability, prompt: string): Promise<T>;
  generate(prompt: string): Promise<string>;
  generateStream?(prompt: string, onChunk: (text: string) => void): Promise<string>;
  generateWithTools(
    systemPrompt: string,
    tools: FunctionDeclaration[],
    history: Array<{
      role: "user" | "model" | "function";
      text?: string;
      functionCall?: FunctionCall;
      functionResponse?: { name: string; response: unknown };
    }>
  ): Promise<{
    text?: string;
    functionCalls?: FunctionCall[];
  }>;
}

export type AIProviderConfig = {
  apiKey: string;
  model?: string;
};
