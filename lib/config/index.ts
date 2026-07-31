export const config = {
  ai: {
    provider: process.env.AI_PROVIDER ?? "gemma",
    model: process.env.AI_MODEL ?? "gemma-4-31b-it",
    apiKey: process.env.GOOGLE_AI_API_KEY ?? "",
    temperature: 0.3,
    maxOutputTokens: 8192,
  },
  database: {
    url: process.env.DATABASE_URL ?? "",
  },
  app: {
    name: "Opportunity AI",
    tagline: "Your Autonomous Opportunity Agent for Africa",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    environment: process.env.NODE_ENV ?? "development",
  },
  agent: {
    maxIterations: 15,
    minResults: 3,
    streamDelay: 50,
  },
} as const;
