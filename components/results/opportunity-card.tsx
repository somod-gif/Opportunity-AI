"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MatchScore } from "@/components/results/match-score";
import { RoadmapView } from "@/components/results/roadmap-view";
import { DocumentView } from "@/components/results/document-view";
import { generateRoadmapAction, generateDocumentAction } from "@/lib/actions/ai";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Target,
  Sparkles,
  Route,
  FileText,
  Loader2,
  Wand2,
} from "lucide-react";
import type { MatchResult, AnalysisInput, ApplicationRoadmap, GeneratedDocument, DocumentType } from "@/lib/ai/prompts";
import { cn } from "@/lib/utils";

interface OpportunityCardProps {
  match: MatchResult;
  index: number;
  analysisInput: AnalysisInput;
  autoGenerate?: boolean;
  onAutoDone?: (type: "roadmap" | DocumentType) => void;
  initialRoadmap?: ApplicationRoadmap | null;
  initialDocuments?: Record<string, GeneratedDocument>;
}

const typeLabels: Record<string, string> = {
  scholarship: "Scholarship",
  fellowship: "Fellowship",
  job: "Job",
  internship: "Internship",
  grant: "Grant",
  accelerator: "Accelerator",
  competition: "Competition",
  conference: "Conference",
  research: "Research",
  hackathon: "Hackathon",
};

const typeColors: Record<string, string> = {
  scholarship: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  fellowship: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  job: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  internship: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  grant: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  competition: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  conference: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  hackathon: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};

export function OpportunityCard({ match, index, analysisInput, autoGenerate, onAutoDone, initialRoadmap, initialDocuments }: OpportunityCardProps) {
  const [expanded, setExpanded] = useState(index === 0 || !!autoGenerate || !!initialRoadmap);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<ApplicationRoadmap | null>(initialRoadmap || null);
  const [roadmapError, setRoadmapError] = useState<string | null>(null);
  const [docLoading, setDocLoading] = useState<DocumentType | null>(null);
  const [documents, setDocuments] = useState<Record<string, GeneratedDocument>>(initialDocuments || {});
  const [docError, setDocError] = useState<string | null>(null);

  useEffect(() => {
    if (autoGenerate) {
      handleGenerateRoadmap();
      handleGenerateDocument("cover-letter");
      handleGenerateDocument("personal-statement");
      handleGenerateDocument("checklist");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGenerate]);

  async function handleGenerateRoadmap() {
    setRoadmapLoading(true);
    setRoadmapError(null);
    const result = await generateRoadmapAction(analysisInput, match);
    if (result.success) {
      setRoadmap(result.data);
      onAutoDone?.("roadmap");
    } else {
      setRoadmapError(result.error);
    }
    setRoadmapLoading(false);
  }

  async function handleGenerateDocument(type: DocumentType) {
    setDocLoading(type);
    setDocError(null);
    const result = await generateDocumentAction(type, analysisInput, match);
    if (result.success) {
      setDocuments((prev) => ({ ...prev, [type]: result.data }));
      onAutoDone?.(type);
    } else {
      setDocError(result.error);
    }
    setDocLoading(null);
  }

  async function handleGenerateAll() {
    handleGenerateRoadmap();
    handleGenerateDocument("cover-letter");
    handleGenerateDocument("personal-statement");
    handleGenerateDocument("checklist");
  }

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-200",
        expanded ? "shadow-md" : "shadow-sm hover:shadow",
        index === 0 && "ring-1 ring-primary/10"
      )}
    >
      <CardHeader className="p-0">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-start gap-4 p-4 text-left transition-colors hover:bg-muted/30 sm:p-5"
        >
          <div className="flex-shrink-0 pt-1">
            <MatchScore score={match.matchScore} size="md" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-base font-semibold leading-tight tracking-tight">
                  {match.title}
                </h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {match.provider}
                </p>
              </div>
              <Badge
                variant="secondary"
                className={cn(
                  "flex-shrink-0 whitespace-nowrap text-xs",
                  typeColors[match.type] || ""
                )}
              >
                {typeLabels[match.type] || match.type}
              </Badge>
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {match.eligibilitySummary}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {match.deadline && (
                <span className="text-xs text-muted-foreground">
                  Deadline:{" "}
                  {new Date(match.deadline).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
              {match.competitiveness && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <AlertCircle className="h-3 w-3" />
                  {match.competitiveness === "high"
                    ? "Highly Competitive"
                    : match.competitiveness === "medium"
                      ? "Moderately Competitive"
                      : "Low Competition"}
                </span>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 pt-1 text-muted-foreground">
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </button>
      </CardHeader>

      {expanded && (
        <CardContent className="border-t px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Why You Qualify
              </h4>
              <ul className="space-y-1.5">
                {match.whyYouQualify.map((reason, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-emerald-500" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                <XCircle className="h-4 w-4 text-amber-500" />
                Gaps to Address
              </h4>
              <ul className="space-y-1.5">
                {match.gaps.map((gap, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-amber-500" />
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Separator className="my-3" />

          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
              <Target className="h-4 w-4 text-primary" />
              Success Probability:{" "}
              <span className="font-semibold text-foreground">
                {match.probability}%
              </span>
            </h4>
          </div>

          <div className="mt-3">
            <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              Recommended Next Steps
            </h4>
            <ol className="space-y-1.5">
              {match.nextSteps.map((step, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <Separator className="my-3" />

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateRoadmap}
              disabled={roadmapLoading}
            >
              {roadmapLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Route className="h-3.5 w-3.5" />
              )}
              {roadmapLoading ? "Generating..." : roadmap ? "Regenerate Roadmap" : "Roadmap"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGenerateDocument("cover-letter")}
              disabled={docLoading === "cover-letter"}
            >
              {docLoading === "cover-letter" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileText className="h-3.5 w-3.5" />
              )}
              {docLoading === "cover-letter" ? "Generating..." : documents["cover-letter"] ? "Regenerate Letter" : "Cover Letter"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGenerateDocument("personal-statement")}
              disabled={docLoading === "personal-statement"}
            >
              {docLoading === "personal-statement" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileText className="h-3.5 w-3.5" />
              )}
              {docLoading === "personal-statement" ? "Generating..." : documents["personal-statement"] ? "Regenerate Statement" : "Statement"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGenerateDocument("checklist")}
              disabled={docLoading === "checklist"}
            >
              {docLoading === "checklist" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileText className="h-3.5 w-3.5" />
              )}
              {docLoading === "checklist" ? "Generating..." : documents["checklist"] ? "Regenerate Checklist" : "Checklist"}
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleGenerateAll}
              disabled={roadmapLoading || docLoading !== null}
            >
              <Wand2 className="h-3.5 w-3.5" />
              Regenerate All
            </Button>
          </div>

          {roadmapError && (
            <p className="mt-2 text-xs text-destructive">{roadmapError}</p>
          )}

          {docError && (
            <p className="mt-2 text-xs text-destructive">{docError}</p>
          )}

          {roadmap && (
            <div className="mt-4 rounded-lg border bg-muted/20 p-4">
              <RoadmapView data={roadmap} />
            </div>
          )}

          {documents["cover-letter"] && (
            <div className="mt-3 rounded-lg border bg-muted/20 p-4">
              <DocumentView
                type="cover-letter"
                content={documents["cover-letter"].content}
                title={match.title}
                onClose={() => setDocuments((prev) => { const newDocs = { ...prev }; delete newDocs["cover-letter"]; return newDocs; })}
              />
            </div>
          )}

          {documents["personal-statement"] && (
            <div className="mt-3 rounded-lg border bg-muted/20 p-4">
              <DocumentView
                type="personal-statement"
                content={documents["personal-statement"].content}
                title={match.title}
                onClose={() => setDocuments((prev) => { const newDocs = { ...prev }; delete newDocs["personal-statement"]; return newDocs; })}
              />
            </div>
          )}

          {documents["checklist"] && (
            <div className="mt-3 rounded-lg border bg-muted/20 p-4">
              <DocumentView
                type="checklist"
                content={documents["checklist"].content}
                title={match.title}
                onClose={() => setDocuments((prev) => { const newDocs = { ...prev }; delete newDocs["checklist"]; return newDocs; })}
              />
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
