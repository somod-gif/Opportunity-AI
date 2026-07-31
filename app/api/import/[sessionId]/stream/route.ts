import { NextRequest } from "next/server";
import { SSEEmitter } from "@/lib/agent/emit";
import { ImportAnalyzer } from "@/lib/import/analyzer";
import type { ImportInput } from "@/lib/import/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<Response> {
  const { sessionId } = await params;
  const url = new URL(req.url);
  const sourceUrl = url.searchParams.get("url") || undefined;
  const text = url.searchParams.get("text") || undefined;
  const deviceId = url.searchParams.get("deviceId") || undefined;
  const education = url.searchParams.get("education") || undefined;
  const skills = url.searchParams.get("skills")?.split(",").filter(Boolean) || undefined;
  const country = url.searchParams.get("country") || undefined;
  const careerGoal = url.searchParams.get("careerGoal") || undefined;
  const experienceLevel = url.searchParams.get("experienceLevel") || undefined;
  const email = url.searchParams.get("email") || undefined;

  if (!sourceUrl && !text) {
    return new Response("Missing url or text parameter", { status: 400 });
  }

  const input: ImportInput = {
    url: sourceUrl,
    text: text || undefined,
    profile: { education, skills, country, careerGoal, experienceLevel, email },
  };

  const emitter = new SSEEmitter();
  const analyzer = new ImportAnalyzer(sessionId, input, emitter, { deviceId });

  let cleanup = false;
  let hadError = false;

  const stream = new ReadableStream({
    async start(controller) {
      emitter.connect(controller);
      try {
        await analyzer.run();
      } catch (error) {
        hadError = true;
        if (!cleanup) {
          emitter.emitError(error instanceof Error ? error.message : String(error));
        }
      } finally {
        if (!cleanup && !hadError) {
          await new Promise((r) => setTimeout(r, 100));
        }
        try { controller.close(); } catch { /* ignore */ }
      }
    },
    cancel() {
      cleanup = true;
      emitter.disconnect();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
