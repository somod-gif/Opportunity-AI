import {
  Bot, Search, Award, Star, Zap, Globe, GraduationCap,
  Brain, FileText, Clock, Shield, Sparkles, Database, Target, BarChart3, Lightbulb, BookOpen
} from "lucide-react";
import type { ComponentType } from "react";
import type { SubAgentStatus } from "@/lib/types";

export interface AgentPersona {
  id: string;
  name: string;
  role: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  color: string;
  gradient: string;
  tools: string[];
  description: string;
  order: number;
}

export const AGENT_PERSONAS: AgentPersona[] = [
  {
    id: "commander",
    name: "Mission Commander",
    role: "Orchestration",
    icon: Bot,
    color: "text-purple-400",
    gradient: "from-purple-500/20 to-purple-500/5",
    tools: [],
    description: "Plans and coordinates all sub-agents",
    order: 0,
  },
  {
    id: "scholarship",
    name: "Scholarship Agent",
    role: "Search",
    icon: Search,
    color: "text-blue-400",
    gradient: "from-blue-500/20 to-blue-500/5",
    tools: ["search_opportunities"],
    description: "Searches scholarship databases worldwide",
    order: 1,
  },
  {
    id: "grant",
    name: "Grant Agent",
    role: "Funding",
    icon: Award,
    color: "text-emerald-400",
    gradient: "from-emerald-500/20 to-emerald-500/5",
    tools: ["search_opportunities"],
    description: "Finds grant and fellowship opportunities",
    order: 2,
  },
  {
    id: "internship",
    name: "Internship Agent",
    role: "Experience",
    icon: Star,
    color: "text-cyan-400",
    gradient: "from-cyan-500/20 to-cyan-500/5",
    tools: ["search_opportunities"],
    description: "Discovers internship and training programs",
    order: 3,
  },
  {
    id: "research",
    name: "Research Agent",
    role: "Academia",
    icon: GraduationCap,
    color: "text-sky-400",
    gradient: "from-sky-500/20 to-sky-500/5",
    tools: ["search_opportunities"],
    description: "Searches research programs and conferences",
    order: 4,
  },
  {
    id: "competition",
    name: "Competition Agent",
    role: "Recognition",
    icon: Zap,
    color: "text-orange-400",
    gradient: "from-orange-500/20 to-orange-500/5",
    tools: ["search_opportunities"],
    description: "Finds competitions and hackathons",
    order: 5,
  },
  {
    id: "web",
    name: "Web Intelligence Agent",
    role: "Discovery",
    icon: Globe,
    color: "text-zinc-400",
    gradient: "from-zinc-500/20 to-zinc-500/5",
    tools: ["web_search"],
    description: "Scrapes websites for opportunities not in database",
    order: 6,
  },
  {
    id: "eligibility",
    name: "Evaluation Agent",
    role: "Scoring",
    icon: Brain,
    color: "text-amber-400",
    gradient: "from-amber-500/20 to-amber-500/5",
    tools: ["eligibility_analyzer", "opportunity_ranking", "gap_analysis"],
    description: "Scores and evaluates opportunity fit",
    order: 7,
  },
  {
    id: "career",
    name: "Career Coach Agent",
    role: "Guidance",
    icon: Lightbulb,
    color: "text-yellow-400",
    gradient: "from-yellow-500/20 to-yellow-500/5",
    tools: ["gap_analysis"],
    description: "Recommends skills, courses, and improvements",
    order: 8,
  },
  {
    id: "document",
    name: "Document Agent",
    role: "Writing",
    icon: FileText,
    color: "text-pink-400",
    gradient: "from-pink-500/20 to-pink-500/5",
    tools: ["generate_document"],
    description: "Generates resumes, cover letters, and checklists",
    order: 9,
  },
  {
    id: "application",
    name: "Application Agent",
    role: "Submission",
    icon: Target,
    color: "text-rose-400",
    gradient: "from-rose-500/20 to-rose-500/5",
    tools: ["generate_document"],
    description: "Prepares and tracks applications",
    order: 10,
  },
  {
    id: "verification",
    name: "Verification Agent",
    role: "Trust",
    icon: Shield,
    color: "text-lime-400",
    gradient: "from-lime-500/20 to-lime-500/5",
    tools: ["web_search"],
    description: "Verifies source credibility and accuracy",
    order: 11,
  },
  {
    id: "deadline",
    name: "Deadline Agent",
    role: "Timing",
    icon: Clock,
    color: "text-yellow-400",
    gradient: "from-yellow-500/20 to-yellow-500/5",
    tools: ["deadline_extractor", "email_reminder"],
    description: "Tracks deadlines and sets reminders",
    order: 12,
  },
  {
    id: "reflection",
    name: "Reflection Agent",
    role: "Quality",
    icon: Sparkles,
    color: "text-violet-400",
    gradient: "from-violet-500/20 to-violet-500/5",
    tools: [],
    description: "Reviews work quality and identifies gaps",
    order: 13,
  },
  {
    id: "memory",
    name: "Memory Agent",
    role: "Persistence",
    icon: Database,
    color: "text-indigo-400",
    gradient: "from-indigo-500/20 to-indigo-500/5",
    tools: [],
    description: "Stores and retrieves mission knowledge",
    order: 14,
  },
];

export function resolvePersonaForTool(toolName: string): AgentPersona {
  const match = AGENT_PERSONAS.find((p) => p.tools.includes(toolName));
  return match || AGENT_PERSONAS[0];
}

export function resolvePersona(id: string): AgentPersona {
  return AGENT_PERSONAS.find((p) => p.id === id) || AGENT_PERSONAS[0];
}

export function getPersonaConfidence(personaId: string, iteration: number): number {
  const base = AGENT_PERSONAS.find((p) => p.id === personaId) ? 70 : 50;
  return Math.min(99, base + iteration * 3);
}

export function createDefaultSubAgents(): SubAgentStatus[] {
  return AGENT_PERSONAS.slice(0, 12).map((p) => ({
    id: p.id,
    name: p.name,
    role: p.role,
    status: "idle" as const,
    confidence: 0,
    currentTask: "",
    currentTool: "",
    reasoning: "",
    lastResult: "",
    executionTime: 0,
    iteration: 0,
  }));
}
