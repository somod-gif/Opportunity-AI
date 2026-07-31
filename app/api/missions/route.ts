import { db } from "@/lib/db";
import { agentMissions } from "@/lib/db/schema";
import { desc, sql } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const deviceId = new URL(req.url).searchParams.get("deviceId");
    if (deviceId) {
      const missions = await db
        .select()
        .from(agentMissions)
        .where(sql`metadata->>'deviceId' = ${deviceId}`)
        .orderBy(desc(agentMissions.createdAt))
        .limit(100);
      return Response.json(missions);
    }
    const missions = await db.select().from(agentMissions).orderBy(desc(agentMissions.createdAt)).limit(100);
    return Response.json(missions);
  } catch {
    return Response.json({ error: "Failed to fetch missions" }, { status: 500 });
  }
}
