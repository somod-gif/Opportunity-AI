import { db } from "@/lib/db";
import { opportunities, agentMissions, applications, agentIterations } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { WorkspaceClient } from "./client";

export const dynamic = "force-dynamic";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

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

  const docs = mission
    ? await db
        .select()
        .from(agentIterations)
        .where(
          and(
            eq(agentIterations.missionId, mission.id),
            eq(agentIterations.toolUsed, "generate_document")
          )
        )
        .orderBy(desc(agentIterations.timestamp))
    : [];

  return (
    <WorkspaceClient
      sessionId={sessionId}
      opportunities={opps}
      applications={apps}
      documents={docs}
      missionGoal={mission?.goal || "Browse opportunities"}
    />
  );
}
