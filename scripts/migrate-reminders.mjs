import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
config({ path: ".env" });

const sql = neon(process.env.DATABASE_URL);

try {
  await sql`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS email text`;
  await sql`ALTER TABLE reminders ADD COLUMN IF NOT EXISTS sent_at timestamp`;
  const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'reminders' ORDER BY ordinal_position`;
  console.log("reminders columns:", cols.map((r) => r.column_name).join(", "));
} catch (e) {
  console.log("Error:", e.message);
  process.exit(1);
}
