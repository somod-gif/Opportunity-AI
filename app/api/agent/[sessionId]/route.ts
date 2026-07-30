import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agentMissions, agentIterations, agentMemories } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
  const { sessionId } = await params;

  const mission = await db
    .select()
    .from(agentMissions)
    .where(eq(agentMissions.sessionId, sessionId))
    .orderBy(desc(agentMissions.createdAt))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!mission) {
    return NextResponse.json({ status: "not_found" }, { status: 404 });
  }

  const memories = await db
    .select()
    .from(agentMemories)
    .where(eq(agentMemories.sessionId, sessionId))
    .orderBy(desc(agentMemories.importance))
    .limit(20);

  const iterations = await db
    .select()
    .from(agentIterations)
    .where(eq(agentIterations.missionId, mission.id))
    .orderBy(desc(agentIterations.iterationNumber));

  return NextResponse.json({
    mission,
    iterations,
    memories,
  });
}
