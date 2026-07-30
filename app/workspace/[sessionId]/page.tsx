import { db } from "@/lib/db";
import { opportunities, agentMissions, applications } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { WorkspaceClient } from "./client";

export const dynamic = "force-dynamic";

export default async function WorkspacePage({
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

  const opps = await db
    .select()
    .from(opportunities)
    .where(eq(opportunities.isActive, true))
    .orderBy(desc(opportunities.createdAt))
    .limit(50);

  const apps = await db
    .select()
    .from(applications)
    .where(eq(applications.sessionId, sessionId))
    .orderBy(desc(applications.createdAt));

  return (
    <WorkspaceClient
      sessionId={sessionId}
      opportunities={opps}
      applications={apps}
      missionGoal={mission?.goal || "Browse opportunities"}
    />
  );
}
