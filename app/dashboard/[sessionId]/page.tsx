import { db } from "@/lib/db";
import { agentMissions, agentIterations, agentMemories } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { ArrowLeft, Bot } from "lucide-react";
import Link from "next/link";
import { DashboardClient } from "./client";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ params }: { params: { sessionId: string } }) {
  const { sessionId } = params;

  const mission = await db
    .select()
    .from(agentMissions)
    .where(eq(agentMissions.sessionId, sessionId))
    .orderBy(desc(agentMissions.createdAt))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!mission) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Mission not found</h1>
          <p className="text-muted-foreground">No agent session found for this ID.</p>
          <Link href="/mission" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Start a new mission
          </Link>
        </div>
      </main>
    );
  }

  const memories = await db
    .select()
    .from(agentMemories)
    .where(eq(agentMemories.sessionId, sessionId))
    .orderBy(desc(agentMemories.importance))
    .limit(10);

  const iterations = await db
    .select()
    .from(agentIterations)
    .where(eq(agentIterations.missionId, mission.id))
    .orderBy(desc(agentIterations.iterationNumber));

  const totalMemories = await db
    .select({ value: count() })
    .from(agentMemories)
    .where(eq(agentMemories.sessionId, sessionId))
    .then((r) => r[0]?.value ?? 0);

  return (
    <DashboardClient
      sessionId={sessionId}
      mission={mission}
      memories={memories}
      iterations={iterations}
      totalMemories={totalMemories}
    />
  );
}
