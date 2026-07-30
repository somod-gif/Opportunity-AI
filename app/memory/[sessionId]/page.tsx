import { db } from "@/lib/db";
import { agentMemories, agentMissions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { MemoryClient } from "./client";

export const dynamic = "force-dynamic";

export default async function MemoryPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const { sessionId } = params;

  const mission = await db
    .select()
    .from(agentMissions)
    .where(eq(agentMissions.sessionId, sessionId))
    .orderBy(desc(agentMissions.createdAt))
    .limit(1)
    .then((r) => r[0] ?? null);

  const memories = await db
    .select()
    .from(agentMemories)
    .where(eq(agentMemories.sessionId, sessionId))
    .orderBy(desc(agentMemories.importance));

  return (
    <MemoryClient
      sessionId={sessionId}
      memories={memories}
      missionGoal={mission?.goal}
    />
  );
}
