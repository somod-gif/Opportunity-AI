/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AIProvider, AIProviderConfig, AICapability, FunctionDeclaration, FunctionCall } from "./provider";

const GOOGLE_AI_BASE = "https://generativelanguage.googleapis.com/v1beta";

function parseJSONResponse<T>(text: string): T {
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

export class GemmaProvider implements AIProvider {
  readonly name = "gemma";
  private apiKey: string;
  private model: string;

  constructor(config?: AIProviderConfig) {
    this.apiKey = config?.apiKey || process.env.GOOGLE_AI_API_KEY || "";
    this.model = config?.model || process.env.AI_MODEL || "gemma-4-26b-a4b-it";
  }

  private getEndpoint(): string {
    return `${GOOGLE_AI_BASE}/models/${this.model}:generateContent?key=${this.apiKey}`;
  }

  private async request(body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const res = await fetch(this.getEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemma API error (${res.status}): ${err}`);
    }
    return res.json();
  }

  async generate(prompt: string): Promise<string> {
    const data = await this.request({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
    });
    const parts = (data as any).candidates?.[0]?.content?.parts || [];
    const texts = parts
      .filter((p: Record<string, unknown>) => !p.thought)
      .map((p: Record<string, unknown>) => p.text as string);
    return texts.join("") || "";
  }

  async generateJSON<T>(_capability: AICapability, prompt: string): Promise<T> {
    const data = await this.request({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
        response_mime_type: "application/json",
      },
    });
    const parts = (data as any).candidates?.[0]?.content?.parts || [];
    const texts = parts
      .filter((p: Record<string, unknown>) => !p.thought)
      .map((p: Record<string, unknown>) => p.text as string);
    const text = texts.join("") || "{}";
    return parseJSONResponse<T>(text);
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
    const contents: Record<string, unknown>[] = [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
    ];

    for (const msg of history) {
      if (msg.role === "user") {
        contents.push({ role: "user", parts: [{ text: msg.text || "" }] });
      } else if (msg.role === "model") {
        const parts: Record<string, unknown>[] = [];
        if (msg.text) parts.push({ text: msg.text });
        if (msg.functionCall) {
          parts.push({
            functionCall: { name: msg.functionCall.name, args: msg.functionCall.args },
          });
        }
        contents.push({ role: "model", parts });
      } else if (msg.role === "function") {
        contents.push({
          role: "function",
          parts: [
            {
              functionResponse: {
                name: msg.functionResponse!.name,
                response: { content: msg.functionResponse!.response },
              },
            },
          ],
        });
      }
    }

    const body: Record<string, unknown> = {
      contents,
      tools: [{ functionDeclarations: tools }],
      toolConfig: { functionCallingConfig: { mode: "auto" } },
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
      },
    };

    const data = await this.request(body);
    const candidate = (data as any).candidates?.[0]?.content;
    if (!candidate) return {};

    const functionCalls: FunctionCall[] = [];
    let text = "";

    for (const part of candidate.parts || []) {
      if (part.text && !part.thought) text += part.text;
      if (part.functionCall) {
        functionCalls.push({
          name: part.functionCall.name,
          args: part.functionCall.args || {},
        });
      }
    }

    return { text: text || undefined, functionCalls: functionCalls.length > 0 ? functionCalls : undefined };
  }
}
