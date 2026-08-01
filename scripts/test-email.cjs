require("dotenv").config({ path: ".env" });
const { Resend } = require("resend");

async function main() {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const domains = await resend.domains.list();
    console.log("DOMAINS RAW:", JSON.stringify(domains, null, 2));
  } catch (e) {
    console.log("domains.list error:", e.message);
  }

  const { data, error } = await resend.emails.send({
    from: "Opportunity AI <onboarding@resend.dev>",
    to: "eniolabadmus351@gmail.com",
    subject: "Opportunity AI — Reminder delivery test",
    html: `<div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0B0E13;color:#F8FAFC;border-radius:12px">
      <h1 style="color:#C9A227;margin:0 0 16px;font-size:20px">Opportunity AI — Test Delivery</h1>
      <div style="background:#161B26;border-radius:8px;padding:20px">
        <p style="margin:0;font-size:16px;line-height:1.5">If you can read this, the reminder delivery pipeline is working. Deadline reminders from your autonomous agent will look exactly like this.</p>
      </div>
      <p style="text-align:center;font-size:12px;color:#64748B;margin-top:16px">Sent by <strong style="color:#C9A227">Opportunity AI</strong> — Your Autonomous Career Agent</p>
    </div>`,
  });

  if (error) {
    console.log("SEND FAILED:", JSON.stringify(error, null, 2));
  } else {
    console.log("SEND OK:", JSON.stringify(data, null, 2));
  }
}

main().catch((e) => console.log("ERROR:", e.message));
