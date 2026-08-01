require("dotenv").config({ path: ".env" });
const { neon } = require("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

(async () => {
  const imp = await sql`SELECT session_id, status, opportunity_id FROM import_analyses WHERE session_id = 'e2e-import-0801'`;
  console.log("import_analyses:", JSON.stringify(imp[0] || null));

  const opp = await sql`SELECT id, slug, title, deadline, application_url FROM opportunities WHERE slug = 'daad-scholarship-database-1'`;
  console.log("opportunity:", JSON.stringify(opp[0] || null));

  const apps = await sql`SELECT session_id, status, notes FROM applications WHERE session_id = 'e2e-import-0801'`;
  console.log("application:", JSON.stringify(apps[0] || null));

  const mems = await sql`SELECT key, memory_type, importance FROM agent_memories WHERE session_id = 'e2e-import-0801'`;
  console.log("memories:", JSON.stringify(mems));

  const rems = await sql`SELECT type, email, sent FROM reminders WHERE session_id = 'e2e-import-0801'`;
  console.log("reminders:", JSON.stringify(rems));
})().catch((e) => console.log("err", e.message));
