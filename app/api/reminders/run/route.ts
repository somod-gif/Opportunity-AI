import { NextResponse } from "next/server";
import { processDueReminders, getResendClient } from "@/lib/reminders/email";

export const maxDuration = 60;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  const { searchParams } = new URL(request.url);
  if (searchParams.get("secret") === secret) return true;
  if (request.headers.get("x-vercel-cron") === "1") return true;
  return false;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const resend = getResendClient();
    const send = async (op: { to: string; subject: string; html: string }): Promise<boolean> => {
      if (!resend) return false;
      try {
        const { error } = await resend.emails.send({
          from: process.env.RESEND_FROM || "Opportunity AI <onboarding@resend.dev>",
          to: op.to,
          subject: op.subject,
          html: op.html,
        });
        if (error) {
          console.warn("[cron] Resend error:", error);
          return false;
        }
        return true;
      } catch (err) {
        console.warn("[cron] send failed:", err);
        return false;
      }
    };

    const result = await processDueReminders(send);
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    console.error("[cron] reminders run failed:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
