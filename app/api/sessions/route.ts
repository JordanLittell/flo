import { getCurrentUser } from "@/lib/auth/access";
import { generateSession } from "@/lib/generation/pipeline";
import { SessionRequestSchema, type GenerationEvent } from "@/lib/generation/request";

// Writing, voicing and storing a class takes minutes.
export const maxDuration = 800;

/**
 * Generates a session and streams progress as newline-delimited JSON (one GenerationEvent per line),
 * ending with { type: "done", sessionId } or { type: "error", message }.
 */
export async function POST(request: Request) {
  // Each call spends Claude and ElevenLabs credit, so only signed-in users may generate.
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });

  const parsed = SessionRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }
  const { prompt, minutes, level, vibe, voiceId } = parsed.data;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({

    // simple stream implementation that sends JSON-L to the GenerateScreen component
    async start(controller) {
      const send = (event: GenerationEvent) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          // The client went away; generation still finishes and the session is stored.
        }
      };


      try {
        for await (const event of generateSession({ prompt, minutes, level }, { voiceId, createdBy: user.id }, { vibe })) {
          send(event);
        }
      } catch (error) {
        console.error("[generate] session failed", error);
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
