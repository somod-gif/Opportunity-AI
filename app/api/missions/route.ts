import { db } from "@/lib/db";
import { agentMissions } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const missions = await db.select().from(agentMissions).orderBy(desc(agentMissions.createdAt)).limit(100);
    return Response.json(missions);
  } catch {
    return Response.json({ error: "Failed to fetch missions" }, { status: 500 });
  }
}
