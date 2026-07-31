"use client";

import { Bot, Loader2 } from "lucide-react";

interface AgentProgressProps {
  currentStep: string;
}

export function AgentProgress({ currentStep }: AgentProgressProps) {
  return (
    <div className="glass rounded-xl p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <Bot className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Gemma is working...</h3>
          <p className="text-sm text-muted-foreground">
            Autonomous agent analyzing your profile
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-lg bg-primary/5 px-4 py-3">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
        <span className="text-sm text-foreground">{currentStep}</span>
      </div>
    </div>
  );
}
