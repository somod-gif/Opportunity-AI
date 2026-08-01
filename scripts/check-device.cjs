require("dotenv").config({ path: ".env" });
const { neon } = require("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

(async () => {
  const m = await sql`SELECT id, metadata FROM agent_missions WHERE metadata->>'deviceId' = 'e2e-device' ORDER BY created_at DESC LIMIT 1`;
  if (!m[0]) return console.log("none");
  const r = m[0].metadata.report || {};
  console.log("report: docs:", r.documentsGenerated, "| tools:", r.toolsUsed, "| iters:", r.iterations, "| success:", r.missionSuccess);

  const rows = await sql`SELECT tool_used, tool_params, tool_result FROM agent_iterations WHERE mission_id::text = ${m[0].id}::text AND tool_used = 'generate_document' ORDER BY timestamp`;
  console.log("generate_document rows:", rows.length);
  for (const row of rows) {
    const p = row.tool_params || {};
    const d = row.tool_result?.data || {};
    console.log("- type:", p.type, "| keys:", Object.keys(d).join(", "), "| opp:", String(p.opportunityTitle || "").slice(0, 40));
    if (p.type === "resume" && typeof d.professionalSummary === "string") console.log("  summary:", d.professionalSummary.slice(0, 120));
    if (p.type === "cover_letter" && typeof d.introduction === "string") console.log("  intro:", d.introduction.slice(0, 120));
  }
})().catch((e) => console.log("err", e.message));
