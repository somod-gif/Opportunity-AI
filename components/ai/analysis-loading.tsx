"use client";

import { useEffect, useState } from "react";
import { Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  "Reading your background",
  "Extracting your skills",
  "Matching opportunities",
  "Ranking by fit",
  "Generating insights",
];

export function AnalysisLoading() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev > 0) {
          setCompletedSteps((done) => [...done, prev - 1]);
        }
        if (prev >= STEPS.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 py-8">
      <div className="text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" />
          Gemma is analyzing
        </div>
        <p className="text-sm text-muted-foreground">
          This usually takes 5-10 seconds
        </p>
      </div>

      <div className="space-y-3">
        {STEPS.map((step, i) => {
          const isComplete = completedSteps.includes(i);
          const isActive = currentStep === i;

          return (
            <div
              key={step}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-4 py-3 transition-all duration-500",
                isComplete &&
                  "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20",
                isActive &&
                  "border-primary/30 bg-primary/[0.03] shadow-sm",
                !isComplete && !isActive && "border-muted"
              )}
            >
              <div className="flex-shrink-0">
                {isComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : isActive ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/20" />
                )}
              </div>
              <span
                className={cn(
                  "text-sm transition-colors",
                  isComplete && "text-emerald-700 dark:text-emerald-300",
                  isActive && "font-medium text-foreground",
                  !isComplete && !isActive && "text-muted-foreground"
                )}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
