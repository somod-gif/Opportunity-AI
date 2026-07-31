import { Bot, Loader2 } from "lucide-react";
import type { ReasoningStep } from "@/lib/ai/agent";

interface AgentLogProps {
  log: ReasoningStep[];
  isRunning: boolean;
}

export function AgentLog({ log, isRunning }: AgentLogProps) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Bot className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Gemma Decision Log</span>
      </div>
      <div className="space-y-1.5">
        {log.map((step, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <span className="mt-0.5 shrink-0 text-emerald-500">✓</span>
            <span className="text-foreground/80">{step.text}</span>
          </div>
        ))}
        {isRunning && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <span>Thinking...</span>
          </div>
        )}
      </div>
    </div>
  );
}
