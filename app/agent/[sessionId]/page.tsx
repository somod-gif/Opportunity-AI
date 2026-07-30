import { Suspense } from "react";
import { ClientAgentPage } from "./client";

export const dynamic = "force-dynamic";

export default async function AgentPage({
  params,
  searchParams,
}: {
  params: { sessionId: string };
  searchParams: Promise<{ goal?: string }>;
}) {
  const { goal } = await searchParams;

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B1020] flex items-center justify-center text-center text-muted-foreground">Loading agent...</div>}>
      <ClientAgentPage sessionId={params.sessionId} goal={goal || ""} />
    </Suspense>
  );
}
