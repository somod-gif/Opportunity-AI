require("dotenv").config({ path: ".env" });
const { neon } = require("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

(async () => {
  const mems = await sql`SELECT session_id::text, memory_type, key, importance FROM agent_memories ORDER BY created_at DESC LIMIT 12`;
  console.log("recent memories:");
  mems.forEach((m) => console.log("-", m.session_id.slice(0, 14), "|", m.memory_type, "|", m.key, "| imp:", m.importance));
  const mis = await sql`SELECT id::text, status FROM agent_missions WHERE metadata->>'deviceId' = 'e2e-device' OR goal LIKE '%Canada%' ORDER BY created_at DESC LIMIT 6`;
  console.log("missions:");
  mis.forEach((m) => console.log("-", m.id.slice(0, 14), "|", m.status));
})().catch((e) => console.log("err", e.message));
