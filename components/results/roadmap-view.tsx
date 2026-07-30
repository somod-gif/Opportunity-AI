"use client";

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, CheckSquare, Lightbulb, ListChecks, Hourglass } from "lucide-react";

export interface RoadmapData {
  timeline: string;
  steps: Array<{
    step: number;
    title: string;
    description: string;
    deadline: string;
    estimatedHours: number;
  }>;
  requiredDocuments: string[];
  preparationTips: string[];
  checklist: string[];
  estimatedTotalHours: number;
}

interface RoadmapViewProps {
  data: RoadmapData;
}

export function RoadmapView({ data }: RoadmapViewProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3 text-sm">
        <div className="flex items-center gap-2">
          <Hourglass className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Timeline:</span>
          <span className="font-medium">{data.timeline}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Est.</span>
          <span className="font-medium">{data.estimatedTotalHours}h</span>
        </div>
      </div>

      <div>
        <h4 className="mb-3 flex items-center gap-1.5 text-sm font-medium">
          <ListChecks className="h-4 w-4 text-primary" />
          Step-by-Step Plan
        </h4>
        <div className="space-y-3">
          {data.steps.map((step) => (
            <div key={step.step} className="relative pl-8">
              <div className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {step.step}
              </div>
              <div className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <h5 className="text-sm font-medium">{step.title}</h5>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {step.estimatedHours}h
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Deadline: {step.deadline}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
            <FileText className="h-4 w-4 text-primary" />
            Required Documents
          </h4>
          <ul className="space-y-1.5">
            {data.requiredDocuments.map((doc, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                {doc}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
            <CheckSquare className="h-4 w-4 text-primary" />
            Checklist
          </h4>
          <ul className="space-y-1.5">
            {data.checklist.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <span className="mt-0.5 h-4 w-4 shrink-0 rounded border border-muted-foreground/30" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {data.preparationTips.length > 0 && (
        <>
          <Separator />
          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Preparation Tips
            </h4>
            <ul className="space-y-1.5">
              {data.preparationTips.map((tip, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
