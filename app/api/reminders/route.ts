import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reminders, opportunities } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { Resend } from "resend";
import { buildReminderEmail } from "@/lib/reminders/email";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

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
      email: email || null,
    });

    let emailSent = false;
    let emailAddress: string | null = null;
    if (resend && email) {
      try {
        const opp = opportunityId
          ? (await db.select().from(opportunities).where(eq(opportunities.id, opportunityId)).limit(1))[0]
          : null;
        const { error } = await resend.emails.send({
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
        if (error) {
          console.warn("Reminder email rejected:", error);
        } else {
          emailSent = true;
          emailAddress = email;
        }
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
