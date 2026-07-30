import { cn } from "@/lib/utils";

interface MatchScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-lg",
};

function getScoreColor(score: number): string {
  if (score >= 85) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 70) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

function getScoreBg(score: number): string {
  if (score >= 85) return "bg-emerald-50 dark:bg-emerald-950/30";
  if (score >= 70) return "bg-emerald-50 dark:bg-emerald-950/30";
  if (score >= 50) return "bg-amber-50 dark:bg-amber-950/30";
  return "bg-rose-50 dark:bg-rose-950/30";
}

function getScoreLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Moderate";
  return "Low";
}

export function MatchScore({ score, size = "md" }: MatchScoreProps) {
  return (
    <div
      className={cn(
        "inline-flex flex-col items-center justify-center rounded-full border-2 font-semibold",
        sizeClasses[size],
        getScoreBg(score),
        getScoreColor(score),
        "border-current"
      )}
      title={`${score}% match - ${getScoreLabel(score)}`}
    >
      {score}
    </div>
  );
}
