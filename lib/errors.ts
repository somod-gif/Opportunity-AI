export class ToolError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "ToolError";
  }
}

export class AIProviderError extends Error {
  constructor(message: string, public provider: string) {
    super(message);
    this.name = "AIProviderError";
  }
}

export class MissionError extends Error {
  constructor(message: string, public phase: string) {
    super(message);
    this.name = "MissionError";
  }
}
