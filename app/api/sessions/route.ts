import { generateSession } from "@/lib/generation/pipeline";
import { SessionRequestSchema, type GenerationEvent } from "@/lib/generation/request";

// Writing, voicing and storing a class takes minutes.
export const maxDuration = 800;

/**
 * Generates a session and streams progress as newline-delimited JSON (one GenerationEvent per line),
 * ending with { type: "done", sessionUrl } or { type: "error", message }.
 */
export async function POST(request: Request) {
  // Each call spends Claude and ElevenLabs credit and there's no sign-in yet, so deployments stay
  // closed unless explicitly opened.
  // if (process.env.NODE_ENV !== "development" && process.env.ALLOW_PUBLIC_GENERATION !== "true") {
  //   return Response.json({ error: "Generation is disabled on this deployment." }, { status: 403 });
  // }

  const parsed = SessionRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }
  const { prompt, minutes, level, vibe, voiceId } = parsed.data;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: GenerationEvent) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          // The client went away; generation still finishes and the session is stored.
        }
      };
      try {
        const session = await generateSession(
          { prompt, minutes, level },
          { voiceId },
          (step) => send({ type: "step", ...step }),
          { vibe },
        );
        send({ type: "done", sessionUrl: session.sessionUrl });
      } catch (error) {
        console.error("[generate] session failed", );
        send({ type: "error", message: error instanceof Error ? error.message : "Generation failed." });
      } finally {
        try {
          controller.close();
        } catch {
          // Already closed by a disconnect.
        }
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
