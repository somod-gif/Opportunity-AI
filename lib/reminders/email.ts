import { db } from "@/lib/db";
import { reminders, opportunities } from "@/lib/db/schema";
import { eq, and, lte, isNotNull } from "drizzle-orm";
import { Resend } from "resend";

export function buildReminderEmail(op: {
  type: string;
  message: string;
  dueAt: string;
  opportunityTitle: string;
  applicationUrl?: string | null;
  recommendation?: string | null;
}) {
  return `<div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0B0E13;color:#F8FAFC;border-radius:12px">
  <div style="text-align:center;margin-bottom:24px">
    <div style="font-size:32px;margin-bottom:8px">⏰</div>
    <h1 style="color:#C9A227;margin:0;font-size:20px">Opportunity AI — ${op.type.replace("_", " ").toUpperCase()}</h1>
  </div>
  <div style="background:#161B26;border-radius:8px;padding:20px;margin-bottom:16px">
    <p style="margin:0 0 8px;font-size:14px;color:#94A3B8">${op.opportunityTitle}</p>
    <p style="margin:0;font-size:16px;line-height:1.5">${op.message}</p>
  </div>
  <div style="display:flex;justify-content:space-between;font-size:13px;color:#94A3B8;margin-bottom:16px">
    <span>Due: ${new Date(op.dueAt).toLocaleDateString()}</span>
  </div>
  ${op.recommendation ? `<div style="background:#121826;border-radius:8px;padding:12px;font-size:13px;color:#94A3B8;margin-bottom:16px"><strong style="color:#3FA78E">AI Recommendation:</strong> ${op.recommendation}</div>` : ""}
  ${op.applicationUrl ? `<div style="text-align:center;margin:20px 0"><a href="${op.applicationUrl}" style="display:inline-block;background:#C9A227;color:#0B0E13;text-decoration:none;font-weight:600;padding:10px 22px;border-radius:6px;font-size:14px">Apply Now</a></div>` : ""}
  <div style="text-align:center;font-size:12px;color:#64748B;border-top:1px solid rgba(255,255,255,0.08);padding-top:16px">
    Sent by <strong style="color:#C9A227">Opportunity AI</strong> — Your Autonomous Career Agent
  </div>
</div>`;
}

export interface ReminderRunResult {
  sent: number;
  failed: number;
  skipped: number;
  attempted: Array<{ id: string; to: string; ok: boolean }>;
}

export async function processDueReminders(
  send: (op: { to: string; subject: string; html: string }) => Promise<boolean>,
  now: Date = new Date()
): Promise<ReminderRunResult> {
  const due = await db
    .select({ reminder: reminders, opportunity: opportunities })
    .from(reminders)
    .leftJoin(opportunities, eq(reminders.opportunityId, opportunities.id))
    .where(and(eq(reminders.sent, false), lte(reminders.dueAt, now), isNotNull(reminders.email)))
    .orderBy(reminders.dueAt);

  const result: ReminderRunResult = { sent: 0, failed: 0, skipped: 0, attempted: [] };

  for (const { reminder, opportunity } of due) {
    if (!reminder.email) {
      result.skipped += 1;
      continue;
    }
    const ok = await send({
      to: reminder.email,
      subject: `Reminder: ${reminder.type.replace("_", " ")} — ${opportunity?.title || "Opportunity"}`,
      html: buildReminderEmail({
        type: reminder.type,
        message: reminder.message,
        dueAt: reminder.dueAt.toISOString(),
        opportunityTitle: opportunity?.title || "Opportunity",
        applicationUrl: opportunity?.applicationUrl,
      }),
    });
    result.attempted.push({ id: reminder.id, to: reminder.email, ok });
    if (ok) {
      await db.update(reminders).set({ sent: true, sentAt: new Date() }).where(eq(reminders.id, reminder.id));
      result.sent += 1;
    } else {
      result.failed += 1;
    }
  }
  return result;
}

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  return apiKey ? new Resend(apiKey) : null;
}
