import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reminders, opportunities } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

function buildReminderEmail(op: {
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  const items = await db.select().from(reminders).where(eq(reminders.sessionId, sessionId)).orderBy(desc(reminders.dueAt));
  return NextResponse.json({ reminders: items });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, opportunityId, type, message, dueAt, email, applicationUrl, recommendation } = body;
    if (!sessionId || !type || !message || !dueAt) {
      return NextResponse.json({ error: "sessionId, type, message and dueAt are required" }, { status: 400 });
    }

    await db.insert(reminders).values({
      sessionId,
      opportunityId: opportunityId || null,
      type,
      message,
      dueAt: new Date(dueAt),
    });

    let emailSent = false;
    let emailAddress: string | null = null;
    if (resend && email) {
      try {
        const opp = opportunityId
          ? (await db.select().from(opportunities).where(eq(opportunities.id, opportunityId)).limit(1))[0]
          : null;
        await resend.emails.send({
          from: process.env.RESEND_FROM || "Opportunity AI <onboarding@resend.dev>",
          to: email,
          subject: `Reminder: ${type.replace("_", " ")} — ${body.opportunityTitle || "Opportunity"}`,
          html: buildReminderEmail({
            type,
            message,
            dueAt,
            opportunityTitle: body.opportunityTitle || opp?.title || "Opportunity",
            applicationUrl: applicationUrl || opp?.applicationUrl,
            recommendation,
          }),
        });
        emailSent = true;
        emailAddress = email;
      } catch (err) {
        console.warn("Reminder email failed:", err);
      }
    }

    return NextResponse.json({ success: true, emailSent, emailAddress });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.delete(reminders).where(and(eq(reminders.id, id)));
  return NextResponse.json({ success: true });
}
