import { db } from "@/lib/db";
import { opportunities, agentMissions, applications } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import { KanbanClient } from "./client";

export const metadata: Metadata = {
  title: "Application Tracker — Opportunity AI",
};

export default async function ApplicationsPage({
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

  const apps = await db
    .select()
    .from(applications)
    .where(eq(applications.sessionId, sessionId))
    .orderBy(desc(applications.createdAt));

  const oppIds = apps.map((a) => a.opportunityId).filter(Boolean) as string[];
  const opps = oppIds.length
    ? await db.select().from(opportunities).where(inArray(opportunities.id, oppIds))
    : [];

  return (
    <KanbanClient
      sessionId={sessionId}
      applications={apps}
      opportunities={opps}
      missionGoal={mission?.goal || "Application Tracker"}
    />
  );
}
