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
    <Suspense fallback={
      <div className="min-h-screen bg-[#0B0E13] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#C9A227] border-t-transparent" />
          <p className="text-sm text-[#F3EEE1]/40 font-mono">Initializing agent pipeline...</p>
        </div>
      </div>
    }>
      <ClientAgentPage sessionId={params.sessionId} goal={goal || ""} />
    </Suspense>
  );
}