"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface SkillsInputProps {
  value: string[];
  onChange: (skills: string[]) => void;
  error?: string;
}

const COMMON_SKILLS = [
  "Python",
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Machine Learning",
  "Deep Learning",
  "Data Science",
  "SQL",
  "Java",
  "C++",
  "Go",
  "Rust",
  "Cloud Computing",
  "AWS",
  "DevOps",
  "Docker",
  "Kubernetes",
  "Flutter",
  "Mobile Development",
  "UI/UX Design",
  "Product Management",
  "Research",
  "Data Analysis",
  "NLP",
  "Computer Vision",
  "Blockchain",
  "Cybersecurity",
  "Leadership",
  "Communication",
  "Project Management",
  "Public Speaking",
  "Technical Writing",
  "Community Management",
  "Entrepreneurship",
];

export function SkillsInput({ value, onChange, error }: SkillsInputProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filtered = COMMON_SKILLS.filter(
    (s) =>
      s.toLowerCase().includes(input.toLowerCase()) && !value.includes(s)
  );

  function addSkill(skill: string) {
    const trimmed = skill.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
    setShowSuggestions(false);
  }

  function removeSkill(skill: string) {
    onChange(value.filter((s) => s !== skill));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (input.trim()) {
        addSkill(input);
      }
    }
    if (e.key === "Backspace" && !input && value.length > 0) {
      removeSkill(value[value.length - 1]);
    }
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-sm ring-offset-background transition-colors",
          "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1",
          error && "border-destructive"
        )}
      >
        {value.map((skill) => (
          <Badge key={skill} variant="secondary" className="gap-1 pr-1">
            {skill}
            <button
              type="button"
              onClick={() => removeSkill(skill)}
              className="ml-0.5 rounded-sm p-0.5 transition-colors hover:bg-muted-foreground/20"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={value.length === 0 ? "Type a skill and press Enter..." : "Add more..."}
          className="min-w-[120px] flex-1 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}

      {showSuggestions && filtered.length > 0 && input.length > 0 && (
        <div className="z-50 max-h-48 overflow-y-auto rounded-lg border bg-popover p-1 shadow-md">
          {filtered.slice(0, 8).map((skill) => (
            <button
              key={skill}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addSkill(skill);
              }}
              className="w-full rounded-md px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-muted"
            >
              {skill}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
