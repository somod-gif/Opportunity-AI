import { ClientImportPage } from "./client";

export default async function ImportSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { sessionId } = await params;
  const sp = await searchParams;
  return (
    <ClientImportPage
      sessionId={sessionId}
      url={sp.url || ""}
      text={sp.text || ""}
    />
  );
}
