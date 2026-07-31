import { db } from "@/lib/db";
import { opportunities, applications } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { OppDetailClient } from "./client";

export const metadata: Metadata = {
  title: "Opportunity Detail — Opportunity AI",
};

export default async function OppDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string; slug: string }>;
}) {
  const { sessionId, slug } = await params;
  const opps = await db.select().from(opportunities).where(eq(opportunities.slug, slug)).limit(1);
  if (!opps.length) notFound();
  const opp = opps[0];

  const apps = await db
    .select()
    .from(applications)
    .where(and(eq(applications.sessionId, sessionId), eq(applications.opportunityId, opp.id)))
    .limit(1);

  const app = apps[0] || null;

  return <OppDetailClient sessionId={sessionId} opportunity={opp} application={app} />;
}
