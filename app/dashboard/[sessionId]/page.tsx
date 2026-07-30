import { db } from "@/lib/db";
import { agentMissions, agentIterations, agentMemories } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { ArrowLeft, Bot, AlertCircle } from "lucide-react";
import Link from "next/link";
import { DashboardClient } from "./client";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;

  let mission: typeof agentMissions.$inferSelect | null = null;
  try {
    mission = await db
      .select()
      .from(agentMissions)
      .where(eq(agentMissions.sessionId, sessionId))
      .orderBy(desc(agentMissions.createdAt))
      .limit(1)
      .then((r) => r[0] ?? null);
  } catch (e) {
    return <ErrorState message={`Database error: ${e instanceof Error ? e.message : "Connection failed"}`} sessionId={sessionId} />;
  }

  if (!mission) {
    return (
      <main className="min-h-screen bg-[#0B0E13] flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-md">
          <Bot className="mx-auto h-12 w-12 text-[#F3EEE1]/30" strokeWidth={1.5} />
          <h1 className="text-xl font-medium text-[#F3EEE1]" style={{ fontFamily: "var(--font-display)" }}>Mission not found</h1>
          <p className="text-sm text-[#F3EEE1]/40">No agent session found for this ID. The agent may still be running or the mission may not have been saved.</p>
          <div className="flex gap-3 justify-center pt-2">
            <Link href={`/agent/${sessionId}?goal=reconnect`} className="rounded-sm bg-[#C9A227] px-4 py-2 text-sm font-semibold text-[#0B0E13] hover:-translate-y-0.5 transition-all">
              Reconnect to Agent
            </Link>
            <Link href="/mission" className="rounded-sm border border-[#F3EEE1]/10 px-4 py-2 text-sm font-medium text-[#F3EEE1]/60 hover:bg-[#F3EEE1]/[0.03] transition-all">
              <ArrowLeft className="inline h-3.5 w-3.5 mr-1" /> New Mission
            </Link>
          </div>
        </div>
      </main>
    );
  }

  let memories: (typeof agentMemories.$inferSelect)[] = [];
  let iterations: (typeof agentIterations.$inferSelect)[] = [];
  let totalMemories = 0;
  try {
    [memories, iterations, totalMemories] = await Promise.all([
      db.select().from(agentMemories).where(eq(agentMemories.sessionId, sessionId)).orderBy(desc(agentMemories.importance)).limit(10),
      db.select().from(agentIterations).where(eq(agentIterations.missionId, mission.id)).orderBy(desc(agentIterations.iterationNumber)),
      db.select({ value: count() }).from(agentMemories).where(eq(agentMemories.sessionId, sessionId)).then((r) => r[0]?.value ?? 0),
    ]);
  } catch {
    // Non-critical data, just show zeros
  }

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

function ErrorState({ message, sessionId }: { message: string; sessionId: string }) {
  return (
    <main className="min-h-screen bg-[#0B0E13] flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md">
        <AlertCircle className="mx-auto h-12 w-12 text-[#C2703D]" strokeWidth={1.5} />
        <h1 className="text-xl font-medium text-[#F3EEE1]" style={{ fontFamily: "var(--font-display)" }}>Dashboard Error</h1>
        <p className="text-sm text-[#F3EEE1]/40">{message}</p>
        <div className="flex gap-3 justify-center pt-2">
          <Link href={`/agent/${sessionId}?goal=reconnect`} className="rounded-sm bg-[#C9A227] px-4 py-2 text-sm font-semibold text-[#0B0E13] transition-all">
            Back to Agent
          </Link>
          <Link href="/mission" className="rounded-sm border border-[#F3EEE1]/10 px-4 py-2 text-sm font-medium text-[#F3EEE1]/60 transition-all">
            New Mission
          </Link>
        </div>
      </div>
    </main>
  );
}
