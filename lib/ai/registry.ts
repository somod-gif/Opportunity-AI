import type { AIProvider } from "./provider";
import { GemmaProvider } from "./gemma-provider";
import { OpenRouterProvider } from "./openrouter-provider";

const providers: Record<string, () => AIProvider> = {
  gemma: () => new GemmaProvider(),
  openrouter: () => new OpenRouterProvider(),
};

export function getProvider(name?: string): AIProvider {
  const providerName = name || process.env.AI_PROVIDER || "gemma";
  const factory = providers[providerName];
  if (!factory) {
    throw new Error(`Unknown AI provider: "${providerName}". Available: ${Object.keys(providers).join(", ")}`);
  }
  return factory();
}

export const DEFAULT_MODEL = process.env.AI_MODEL || "gemma-4-31b-it";

export function getDefaultModel(): string {
  return DEFAULT_MODEL;
}
