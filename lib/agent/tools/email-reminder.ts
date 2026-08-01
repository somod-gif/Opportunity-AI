import { z } from "zod";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { reminders } from "@/lib/db/schema";
import type { AgentTool, ToolResult, ToolContext } from "./base";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const emailReminderTool: AgentTool = {
  name: "email_reminder",
  description: "Set up an email reminder for an upcoming deadline or follow-up action",
  parameters: z.object({
    opportunityTitle: z.string(),
    reminderType: z.enum(["deadline", "follow_up", "document"]),
    message: z.string(),
    dueAt: z.string(),
    email: z.string().optional(),
    notes: z.string().optional(),
  }),
  async execute(params: unknown, ctx: ToolContext): Promise<ToolResult> {
    const p = params as { opportunityTitle: string; reminderType: "deadline" | "follow_up" | "document"; message: string; dueAt: string; email?: string; notes?: string };

    await db.insert(reminders).values({
      sessionId: ctx.sessionId,
      type: p.reminderType,
      message: p.message,
      dueAt: new Date(p.dueAt),
      email: p.email ?? null,
    });

    let emailSent = false;
    if (resend && p.email) {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM || "Opportunity AI <onboarding@resend.dev>",
          to: p.email,
          subject: `Reminder: ${p.reminderType.replace("_", " ")} — ${p.opportunityTitle}`,
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0B1020;color:#F8FAFC;border-radius:12px">
            <div style="text-align:center;margin-bottom:24px">
              <div style="font-size:32px;margin-bottom:8px">⏰</div>
              <h1 style="color:#7C3AED;margin:0;font-size:20px">Opportunity AI — Reminder</h1>
            </div>
            <div style="background:#1A2235;border-radius:8px;padding:20px;margin-bottom:16px">
              <p style="margin:0 0 8px;font-size:14px;color:#94A3B8">${p.reminderType.replace("_", " ").toUpperCase()}</p>
              <p style="margin:0;font-size:16px;line-height:1.5">${p.message}</p>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:13px;color:#94A3B8;margin-bottom:16px">
              <span>Opportunity: ${p.opportunityTitle}</span>
              <span>Due: ${new Date(p.dueAt).toLocaleDateString()}</span>
            </div>
            ${p.notes ? `<div style="background:#121826;border-radius:8px;padding:12px;font-size:13px;color:#94A3B8;margin-bottom:16px"><strong>Notes:</strong> ${p.notes}</div>` : ""}
            <div style="text-align:center;font-size:12px;color:#64748B;border-top:1px solid rgba(255,255,255,0.08);padding-top:16px">
              Sent by <strong style="color:#7C3AED">Opportunity AI</strong> — Your Autonomous Career Agent
            </div>
          </div>`,
        });
        emailSent = true;
      } catch (err) {
        console.warn("Failed to send reminder email:", err);
      }
    }

    return {
      success: true,
      data: {
        reminder: {
          type: p.reminderType,
          message: p.message,
          dueAt: p.dueAt,
          opportunity: p.opportunityTitle,
          emailSent,
          emailAddress: p.email || null,
        },
      },
      summary: `Reminder set: "${p.message}" (due ${p.dueAt})${emailSent ? " · Email sent" : ""}`,
      metadata: {
        type: p.reminderType,
        dueAt: p.dueAt,
        opportunity: p.opportunityTitle,
        emailSent,
      },
    };
  },
};

export const pdfGeneratorTool: AgentTool = {
  name: "pdf_generator",
  description: "Generate a PDF document from markdown content for a specific document type",
  parameters: z.object({
    content: z.string(),
    title: z.string(),
    documentType: z.enum(["cover-letter", "personal-statement", "resume", "checklist", "report"]),
    includeMetadata: z.boolean().default(true),
  }),
  async execute(params: unknown, _ctx: ToolContext): Promise<ToolResult> {
    const p = params as { content: string; title: string; documentType: "cover-letter" | "personal-statement" | "resume" | "checklist" | "report"; includeMetadata: boolean };
    return {
      success: true,
      data: {
        content: p.content,
        title: p.title,
        type: p.documentType,
        generatedAt: new Date().toISOString(),
        metadata: p.includeMetadata ? {
          documentType: p.documentType,
          pageCount: Math.ceil(p.content.length / 3000) + 1,
          wordCount: p.content.split(/\s+/).length,
        } : undefined,
      },
      summary: `PDF generated for "${p.title}" (${p.documentType})`,
      metadata: { type: p.documentType, title: p.title },
    };
  },
};
