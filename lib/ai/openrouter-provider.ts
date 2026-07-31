import type { AIProvider, AIProviderConfig, AICapability, FunctionDeclaration, FunctionCall } from "./provider";
import { DEFAULT_MODEL } from "./registry";

interface OpenRouterResponse {
  id: string;
  choices: Array<{
    index: number;
    message: {
      role: "assistant";
      content: string | null;
      tool_calls?: Array<{
        id: string;
        type: "function";
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface StreamChunk {
  choices: Array<{
    delta: {
      content?: string;
      tool_calls?: Array<{
        index: number;
        id?: string;
        type?: "function";
        function?: {
          name?: string;
          arguments?: string;
        };
      }>;
    };
    finish_reason: string | null;
  }>;
}

function parseJSONFromText<T>(text: string): T {
  text = text.trim();
  if (text.startsWith("```")) {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) text = match[1].trim();
  }
  const braceStart = text.indexOf("{");
  const braceEnd = text.lastIndexOf("}");
  const bracketStart = text.indexOf("[");
  const bracketEnd = text.lastIndexOf("]");
  if (braceStart !== -1 && braceEnd > braceStart) {
    text = text.slice(braceStart, braceEnd + 1);
  } else if (bracketStart !== -1 && bracketEnd > bracketStart) {
    text = text.slice(bracketStart, bracketEnd + 1);
  }
  return JSON.parse(text) as T;
}

export class OpenRouterProvider implements AIProvider {
  readonly name = "openrouter";
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(config?: AIProviderConfig) {
    this.apiKey = config?.apiKey || process.env.OPENROUTER_API_KEY || "";
    this.baseUrl = (process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1").replace(/\/+$/, "");
    this.model = config?.model || process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  }

  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
      "HTTP-Referer": "https://opportunity-ai.vercel.app",
      "X-Title": "Opportunity AI",
    };
  }

  private async request(body: Record<string, unknown>, retries = 2, timeout = 30000, plugins?: Array<Record<string, unknown>>): Promise<OpenRouterResponse> {
    if (plugins) body.plugins = plugins;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 1000 * attempt));
        const res = await fetch(`${this.baseUrl}/chat/completions`, {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        if (!res.ok) {
          const err = await res.text().catch(() => "Unknown error");
          throw new Error(`OpenRouter API error (${res.status}): ${err}`);
        }
        return res.json() as Promise<OpenRouterResponse>;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (err instanceof DOMException && err.name === "AbortError") break;
      }
    }
    clearTimeout(timer);
    throw lastError || new Error("Request failed after retries");
  }

  async generate(prompt: string): Promise<string> {
    const data = await this.request({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 8192,
    });
    return data.choices?.[0]?.message?.content || "";
  }

  async generateJSON<T>(capability: AICapability, prompt: string): Promise<T> {
    const plugins = capability === "search" ? [{ id: "web_search" }] : undefined;
    const systemMsg = capability === "search"
      ? "You are an AI assistant with web search capability. Use web search results to find current opportunities. Return ONLY valid JSON."
      : "You are an autonomous AI agent. Return ONLY valid JSON matching the requested schema. No markdown, no explanation.";
    const data = await this.request({
      model: this.model,
      messages: [
        { role: "system", content: systemMsg },
        { role: "user", content: prompt },
      ],
      temperature: capability === "search" ? 0.3 : 0.1,
      max_tokens: 8192,
      response_format: { type: "json_object" },
    }, 2, 45000, plugins);
    const text = data.choices?.[0]?.message?.content || "{}";
    return parseJSONFromText<T>(text);
  }

  async generateStream(prompt: string, onChunk: (text: string) => void): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000);
    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 8192,
          stream: true,
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const err = await res.text().catch(() => "Unknown error");
        throw new Error(`OpenRouter stream error (${res.status}): ${err}`);
      }

      let fullText = "";
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          const jsonStr = trimmed.slice(6);
          if (jsonStr === "[DONE]") break;
          try {
            const chunk: StreamChunk = JSON.parse(jsonStr);
            const content = chunk.choices?.[0]?.delta?.content || "";
            if (content) {
              fullText += content;
              onChunk(content);
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
      return fullText;
    } finally {
      clearTimeout(timer);
    }
  }

  async generateWithTools(
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
  }> {
    const messages: Record<string, unknown>[] = [
      { role: "system", content: systemPrompt },
    ];

    for (const msg of history) {
      if (msg.role === "user") {
        messages.push({ role: "user", content: msg.text || "" });
      } else if (msg.role === "model") {
        const m: Record<string, unknown> = { role: "assistant", content: msg.text || "" };
        if (msg.functionCall) {
          m.tool_calls = [{
            id: `call_${Date.now()}`,
            type: "function",
            function: { name: msg.functionCall.name, arguments: JSON.stringify(msg.functionCall.args) },
          }];
        }
        messages.push(m);
      } else if (msg.role === "function") {
        messages.push({
          role: "tool",
          tool_call_id: `call_${Date.now()}`,
          content: JSON.stringify(msg.functionResponse?.response),
        });
      }
    }

    const openRouterTools = tools.map((t) => ({
      type: "function" as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters as Record<string, unknown>,
      },
    }));

    const data = await this.request({
      model: this.model,
      messages,
      tools: openRouterTools.length > 0 ? openRouterTools : undefined,
      tool_choice: "auto" as const,
      temperature: 0.3,
      max_tokens: 8192,
    });

    const message = data.choices?.[0]?.message;
    if (!message) return {};

    const functionCalls: FunctionCall[] = [];
    if (message.tool_calls) {
      for (const tc of message.tool_calls) {
        functionCalls.push({
          name: tc.function.name,
          args: JSON.parse(tc.function.arguments || "{}"),
        });
      }
    }

    return {
      text: message.content || undefined,
      functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
    };
  }
}
