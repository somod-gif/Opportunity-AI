import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { importAnalyses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<Response> {
  const { sessionId } = await params;
  try {
    const rows = await db
      .select()
      .from(importAnalyses)
      .where(eq(importAnalyses.sessionId, sessionId))
      .limit(1);
    const analysis = rows[0];
    if (!analysis) {
      return Response.json({ status: "not_found" }, { status: 404 });
    }
    if (analysis.status === "complete" && analysis.report) {
      return Response.json({ status: "complete", report: analysis.report });
    }
    return Response.json({ status: analysis.status });
  } catch {
    return Response.json({ error: "Failed to load analysis" }, { status: 500 });
  }
}
