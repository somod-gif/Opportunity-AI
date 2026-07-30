"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { downloadPdf } from "@/lib/download-pdf";
import type { DocumentType } from "@/lib/ai/prompts";

interface DownloadButtonProps {
  content: string;
  title: string;
  docType: DocumentType;
  variant?: "outline" | "default" | "ghost";
  size?: "xs" | "sm" | "default";
}

export function DownloadButton({
  content,
  title,
  docType,
  variant = "outline",
  size = "xs",
}: DownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      await downloadPdf(content, title, docType);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handleDownload} disabled={loading}>
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      {loading ? "Creating PDF..." : "Download PDF"}
    </Button>
  );
}
