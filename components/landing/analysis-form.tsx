"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  educationLevels,
  africanCountries,
} from "@/lib/schemas/form";
import { analyzeOpportunitiesAction } from "@/lib/actions/ai";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkillsInput } from "@/components/landing/skills-input";
import { AgentProgress } from "@/components/ai/agent-progress";
import { AgentLog } from "@/components/ai/agent-log";
import { OpportunityCard } from "@/components/results/opportunity-card";
import { Sparkles, AlertCircle, Bot } from "lucide-react";
import type { ActionResult } from "@/lib/actions/ai";
import type { AgentResult, ReasoningStep } from "@/lib/ai/agent";
import type { AnalysisInput } from "@/lib/ai/prompts";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  education: z.string().min(1, "Education level is required"),
  skills: z.array(z.string()).min(1, "Add at least one skill"),
  careerGoal: z.string().min(10, "Describe your career goal"),
  country: z.string().min(1, "Country is required"),
});

type FormData = z.infer<typeof formSchema>;

export function AnalysisForm() {
  const [result, setResult] = useState<ActionResult<AgentResult> | null>(null);
  const [pending, startTransition] = useTransition();
  const [lastInput, setLastInput] = useState<AnalysisInput | null>(null);
  const [agentStep, setAgentStep] = useState<string | null>(null);
  const [agentLog, setAgentLog] = useState<ReasoningStep[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      education: "",
      skills: [],
      careerGoal: "",
      country: "",
    },
  });

  const skills = watch("skills");

  async function onSubmit(data: FormData) {
    setResult(null);
    setLastInput({
      name: data.name,
      education: data.education,
      skills: data.skills,
      careerGoal: data.careerGoal,
      country: data.country,
    });
    setAgentLog([]);

    const formData = new FormData();
    formData.set("name", data.name);
    formData.set("education", data.education);
    formData.set("skills", JSON.stringify(data.skills));
    formData.set("careerGoal", data.careerGoal);
    formData.set("country", data.country);

    startTransition(async () => {
      setAgentStep("Reading profile...");
      const res = await analyzeOpportunitiesAction(null, formData);
      setResult(res);

      if (res.success) {
        setAgentLog(res.data.log);
        setAgentStep(null);
      } else {
        setAgentStep(null);
      }
    });
  }

  const hasResults = result?.success && result.data.matches.length > 0;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="glass rounded-xl p-6 sm:p-8 space-y-6"
      >
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">One-click. Everything happens automatically.</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your profile once. The AI agent analyzes, matches, plans, and prepares your applications.
            No buttons to click after this form.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Your full name"
              className={errors.name ? "border-destructive" : ""}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="education">Education Level</Label>
            <Select
              onValueChange={(v) => setValue("education", v, { shouldValidate: true })}
            >
              <SelectTrigger id="education" className={errors.education ? "border-destructive" : ""}>
                <SelectValue placeholder="Select your education level" />
              </SelectTrigger>
              <SelectContent>
                {educationLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.education && (
              <p className="text-xs text-destructive">{errors.education.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">Skills</Label>
            <SkillsInput
              value={skills}
              onChange={(s) => setValue("skills", s, { shouldValidate: true })}
              error={errors.skills?.message}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="careerGoal">Career Goal</Label>
            <Textarea
              id="careerGoal"
              placeholder="e.g. I want to become a machine learning engineer working on healthcare solutions for Africa..."
              className={errors.careerGoal ? "border-destructive" : ""}
              {...register("careerGoal")}
            />
            {errors.careerGoal && (
              <p className="text-xs text-destructive">{errors.careerGoal.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select
              onValueChange={(v) => setValue("country", v, { shouldValidate: true })}
            >
              <SelectTrigger id="country" className={errors.country ? "border-destructive" : ""}>
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent>
                {africanCountries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.country && (
              <p className="text-xs text-destructive">{errors.country.message}</p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full gap-2"
          disabled={pending}
        >
          {pending ? (
            <>
              <Sparkles className="h-4 w-4 animate-pulse" />
              AI Agent is working...
            </>
          ) : (
            <>
              <Bot className="h-4 w-4" />
              Launch AI Agent
            </>
          )}
        </Button>
      </form>

      {pending && agentStep && (
        <AgentProgress currentStep={agentStep} />
      )}

      {result && !result.success && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
            <div>
              <h3 className="text-sm font-medium text-destructive">Agent Failed</h3>
              <p className="mt-1 text-sm text-muted-foreground">{result.error}</p>
            </div>
          </div>
        </div>
      )}

      {hasResults && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">
              {result.data.matches.length} opportunit{result.data.matches.length !== 1 ? "ies" : "y"} found
            </h2>
          </div>

          {agentLog.length > 0 && (
            <AgentLog log={agentLog} isRunning={false} />
          )}

          <div className="space-y-3">
            {result.data.matches.slice(0, 3).map((match, i) => (
              <OpportunityCard
                key={`${match.title}-${i}`}
                match={match}
                index={i}
                analysisInput={lastInput!}
                initialRoadmap={i === 0 ? result.data.roadmap : undefined}
                initialDocuments={i === 0 ? result.data.documents : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {result && result.success && result.data.matches.length === 0 && (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-lg font-medium">No matches found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try expanding your skills or adjusting your career goal
          </p>
        </div>
      )}
    </div>
  );
}
