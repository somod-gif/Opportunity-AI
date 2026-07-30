import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/utils";
import { db } from "@/lib/db";
import { agentMissions, agentMemories } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { Bot, Mail, User, Calendar, Target, Database, ArrowLeft, LogOut } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session?.email) redirect("/login");

  const missionCount = await db
    .select({ value: count() })
    .from(agentMissions)
    .where(eq(agentMissions.sessionId, session.sessionId))
    .then((r) => r[0]?.value ?? 0);

  const memoryCount = await db
    .select({ value: count() })
    .from(agentMemories)
    .where(eq(agentMemories.sessionId, session.sessionId))
    .then((r) => r[0]?.value ?? 0);

  const lastMission = await db
    .select({ goal: agentMissions.goal, status: agentMissions.status, createdAt: agentMissions.createdAt })
    .from(agentMissions)
    .where(eq(agentMissions.sessionId, session.sessionId))
    .orderBy(desc(agentMissions.createdAt))
    .limit(1)
    .then((r) => r[0] ?? null);

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="mx-auto max-w-2xl">
        <Link href="/mission" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to missions
        </Link>

        <div className="glass rounded-xl p-8 glow-sm">
          <div className="flex items-center gap-5 mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5">
              <span className="text-2xl font-bold text-primary">
                {(session.name || "U").charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{session.name || "User"}</h1>
              <p className="text-sm text-muted-foreground">{session.email}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 mb-8">
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xl font-bold">{missionCount}</p>
                  <p className="text-xs text-muted-foreground">Missions</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-charcoal-400" />
                <div>
                  <p className="text-xl font-bold">{memoryCount}</p>
                  <p className="text-xs text-muted-foreground">Memories</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-stone-400" />
                <div>
                  <p className="text-xl font-bold">{lastMission ? "Active" : "0"}</p>
                  <p className="text-xs text-muted-foreground">Status</p>
                </div>
              </div>
            </div>
          </div>

          {lastMission && (
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4 mb-8">
              <h3 className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">Last Mission</h3>
              <p className="text-sm font-medium">{lastMission.goal}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-xs ${lastMission.status === "complete" ? "text-ash-400" : lastMission.status === "failed" ? "text-smoke-400" : "text-stone-400"}`}>
                  {lastMission.status}
                </span>
                {lastMission.createdAt && (
                  <span className="text-xs text-muted-foreground/50">
                    {new Date(lastMission.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Link
              href="/mission"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.97]"
            >
              <Target className="h-4 w-4" /> New Mission
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-6 py-3 text-sm font-medium hover:bg-white/5 transition-all active:scale-[0.97]"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
