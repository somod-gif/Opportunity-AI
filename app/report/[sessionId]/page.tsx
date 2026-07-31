import { db } from "@/lib/db";
import { agentMissions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ReportClient } from "./client";

export const metadata: Metadata = {
  title: "Mission Report — Opportunity AI",
};

export default async function ReportPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const missions = await db.select().from(agentMissions).where(eq(agentMissions.sessionId, sessionId)).limit(1);
  if (!missions.length) notFound();
  return <ReportClient mission={missions[0]} />;
}
