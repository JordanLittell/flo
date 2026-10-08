import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { TRANSCRIPT_SYSTEM_PROMPT, transcriptUserMessage } from "./transcript-prompt";

export const TRANSCRIPT_MODEL = "claude-opus-5-5";

/** Speaking rate the prompt plans against; used for estimates before audio exists. */
export const WORDS_PER_SECOND = 2.3;

export const SegmentSchema = z.object({
  pose: z.string().nullable(),
  kind: z.enum(["intro", "transition", "cue", "breath", "closing"]),
  text: z.string(),
  pauseAfterSeconds: z.number(),
});

export const TranscriptSchema = z.object({
  title: z.string(),
  description: z.string(),
  level: z.enum(["Beginner", "Intermediate", "Advanced", "All levels"]),
  minutes: z.number(),
  segments: z.array(SegmentSchema),
});

export type Segment = z.infer<typeof SegmentSchema>;
export type Transcript = z.infer<typeof TranscriptSchema>;

export interface TranscriptInput {
  prompt: string;
  /** Default length; the prompt's own length wins if it names one. */
  minutes: number;
  level?: string;
}

/** Estimated spoken length in seconds, before any audio is generated. */
export function estimateSeconds(transcript: Transcript): number {
  return transcript.segments.reduce(
    (total, segment) => total + segment.text.split(/\s+/).filter(Boolean).length / WORDS_PER_SECOND + segment.pauseAfterSeconds,
    0,
  );
}

export async function generateTranscript(input: TranscriptInput, client = new Anthropic()): Promise<Transcript> {
  // Streaming keeps a long class (large max_tokens) clear of HTTP timeouts.
  // fallbacks: "default" re-runs a safety refusal on Anthropic's recommended fallback model.
  console.log("generating transcript", input);
  const stream = client.beta.messages.stream({
    model: TRANSCRIPT_MODEL,
    max_tokens: 64000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "high", format: betaZodOutputFormat(TranscriptSchema) },
    system: [{ type: "text", text: TRANSCRIPT_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: transcriptUserMessage(input) }],
  });
  const message = await stream.finalMessage();

  if (message.stop_reason === "refusal") {
    throw new Error(`Transcript request was declined: ${message.stop_details?.explanation ?? "no explanation"}`);
  }
  if (message.stop_reason === "max_tokens") {
    throw new Error("Transcript was cut off at max_tokens.");
  }

  const text = message.content.flatMap((block) => (block.type === "text" ? [block.text] : [])).join("");
  const transcript = TranscriptSchema.parse(JSON.parse(text));
  const segments = transcript.segments.map((segment) => ({
    ...segment,
    pauseAfterSeconds: Math.min(Math.max(segment.pauseAfterSeconds, 0), 20),
  }));
  console.log("segments", segments);
  return {
    ...transcript,
    // Guard against out-of-range silences regardless of what the model returned.
    segments,
  };
}
