import { NextRequest } from "next/server";
import { SSEEmitter } from "@/lib/agent/emit";
import { MultiAgentCoordinator } from "@/lib/agent/multi-agent";
import type { Mission } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<Response> {
  const { sessionId } = await params;
  const url = new URL(req.url);
  const goal = url.searchParams.get("goal") || "";
  const education = url.searchParams.get("education") || undefined;
  const skills = url.searchParams.get("skills")?.split(",").filter(Boolean) || undefined;
  const country = url.searchParams.get("country") || undefined;
  const careerGoal = url.searchParams.get("careerGoal") || undefined;
  const experienceLevel = url.searchParams.get("experienceLevel") || undefined;
  const email = url.searchParams.get("email") || undefined;

  if (!goal) {
    return new Response("Missing goal parameter", { status: 400 });
  }

  const mission: Mission = { goal, education, skills, country, careerGoal, experienceLevel, email };
  const emitter = new SSEEmitter();
  const coordinator = new MultiAgentCoordinator(sessionId, mission, emitter);

  let cleanup = false;
  let hadError = false;

  const stream = new ReadableStream({
    async start(controller) {
      emitter.connect(controller);

      try {
        await coordinator.initialize();
        const report = await coordinator.run();

        if (!cleanup) {
          emitter.emit({
            type: "complete",
            data: {
              summary: `Mission complete after ${report.iterations} iterations`,
              report,
            },
          });
        }
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
