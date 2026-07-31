import type { Metadata } from "next";
import { db } from "@/lib/db";
import { agentMissions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { SettingsClient } from "./client";

export const metadata: Metadata = { title: "Settings — Opportunity AI" };

export default async function SettingsPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  let missionGoal: string | null = null;
  try {
    const mission = (await db.select({ goal: agentMissions.goal }).from(agentMissions).where(eq(agentMissions.sessionId, sessionId)).limit(1))[0];
    missionGoal = mission?.goal || null;
  } catch {
    missionGoal = null;
  }

  const status = {
    provider: process.env.AI_PROVIDER || "gemma",
    model: process.env.AI_MODEL || "gemma-4-31b-it",
    database: Boolean(process.env.DATABASE_URL),
    email: Boolean(process.env.RESEND_API_KEY),
    emailFrom: process.env.RESEND_FROM || "onboarding@resend.dev",
    openrouter: Boolean(process.env.OPENROUTER_API_KEY),
  };

  return <SettingsClient sessionId={sessionId} missionGoal={missionGoal} status={status} />;
}
