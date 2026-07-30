"use client";

import { FileText, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/shared/download-button";
import type { DocumentType } from "@/lib/ai/prompts";

interface DocumentViewProps {
  type: DocumentType;
  content: string;
  title: string;
  onClose?: () => void;
}

const typeLabels: Record<DocumentType, string> = {
  "cover-letter": "Cover Letter",
  "personal-statement": "Personal Statement",
  "checklist": "Application Checklist",
  "resume": "Resume",
};

const typeIcons: Record<DocumentType, string> = {
  "cover-letter": "✉️",
  "personal-statement": "📝",
  "checklist": "✅",
  "resume": "📄",
};

export function DocumentView({ type, content, title, onClose }: DocumentViewProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-medium">
            {typeIcons[type]} {typeLabels[type]}
          </h4>
        </div>
        <div className="flex gap-2">
          <DownloadButton content={content} title={title} docType={type} />
          {onClose && (
            <Button variant="ghost" size="xs" onClick={onClose}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="prose prose-sm dark:prose-invert max-h-[30rem] overflow-y-auto rounded-lg border bg-background p-4">
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="mb-3 mt-1 text-lg font-bold">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="mb-2 mt-4 text-base font-semibold">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="mb-1 mt-3 text-sm font-semibold">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="mb-2 text-sm leading-relaxed">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="mb-3 space-y-1">{children}</ul>
            ),
            li: ({ children }) => (
              <li className="ml-4 list-disc text-sm">{children}</li>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold">{children}</strong>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
