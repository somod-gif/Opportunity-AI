export type AgentLogLevel = "trace" | "debug" | "info" | "warn" | "error";

export interface AgentLogEntry {
  timestamp: number;
  level: AgentLogLevel;
  sessionId: string;
  missionId: string;
  iteration: number;
  phase: string;
  message: string;
  data?: unknown;
}

export class AgentLogger {
  private logs: AgentLogEntry[] = [];
  private maxLogs = 1000;

  constructor(
    private sessionId: string,
    private missionId: string
  ) {}

  private log(
    level: AgentLogLevel,
    phase: string,
    iteration: number,
    message: string,
    data?: unknown
  ): void {
    const entry: AgentLogEntry = {
      timestamp: Date.now(),
      level,
      sessionId: this.sessionId,
      missionId: this.missionId,
      iteration,
      phase,
      message,
      data,
    };
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  trace(phase: string, iteration: number, message: string, data?: unknown): void {
    this.log("trace", phase, iteration, message, data);
  }

  debug(phase: string, iteration: number, message: string, data?: unknown): void {
    this.log("debug", phase, iteration, message, data);
  }

  info(phase: string, iteration: number, message: string, data?: unknown): void {
    this.log("info", phase, iteration, message, data);
  }

  warn(phase: string, iteration: number, message: string, data?: unknown): void {
    this.log("warn", phase, iteration, message, data);
  }

  error(phase: string, iteration: number, message: string, data?: unknown): void {
    this.log("error", phase, iteration, message, data);
  }

  getAll(): AgentLogEntry[] {
    return [...this.logs];
  }

  getByLevel(level: AgentLogLevel): AgentLogEntry[] {
    return this.logs.filter((e) => e.level === level);
  }

  getRecent(count = 10): AgentLogEntry[] {
    return this.logs.slice(-count);
  }

  clear(): void {
    this.logs = [];
  }
}
