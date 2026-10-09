import Anthropic from "@anthropic-ai/sdk";
import type { BetaRawMessageStreamEvent } from "@anthropic-ai/sdk/resources/beta/messages";
import { z } from "zod";
import { TRANSCRIPT_SYSTEM_PROMPT, transcriptUserMessage } from "./transcript-prompt";

export const TRANSCRIPT_MODEL = "claude-opus-5-5";

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

/** One line of the model's JSON Lines output: a header first, then one line per segment. */
const TranscriptLineSchema = z.discriminatedUnion("type", [
  TranscriptSchema.omit({ segments: true }).extend({ type: z.literal("header") }),
  SegmentSchema.extend({ type: z.literal("segment"), percentComplete: z.number() }),
]);

export interface TranscriptInput {
  prompt: string;
  /** Default length; the prompt's own length wins if it names one. */
  minutes: number;
  level?: string;
}

type ProgressEvent = {
  type: "step";
  step: "script";
  status: "active";
  progress: number;
};

type ContentEvent = {
  type: "content";
  content: z.infer<typeof TranscriptLineSchema>;
};

export type TranscriptGenerationEvent = ProgressEvent | ContentEvent;

/** Yields each complete line of streamed text, and whatever is left once the stream ends. */
async function* lines(stream: AsyncIterable<BetaRawMessageStreamEvent>): AsyncGenerator<string, void, undefined> {
  let buffer = "";
  for await (const chunk of stream) {
    if (chunk.type !== "content_block_delta" || chunk.delta.type !== "text_delta") continue;
    buffer += chunk.delta.text;
    const parts = buffer.split("\n");
    buffer = parts.pop() ?? "";
    yield* parts;
  }
  if (buffer) yield buffer;
}

/** Streams the script as JSON Lines, yielding the model's own percentComplete as a 0–1 fraction, and returns the transcript. */
export async function* generateTranscript(
  input: TranscriptInput,
  client = new Anthropic(),
): AsyncGenerator<TranscriptGenerationEvent, void, undefined> {
  // Streaming keeps a long class (large max_tokens) clear of HTTP timeouts.
  // fallbacks: "default" re-runs a safety refusal on Anthropic's recommended fallback model.
  console.log("generating transcript", input);
  const stream = client.beta.messages.stream({
    model: TRANSCRIPT_MODEL,
    max_tokens: 64000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "high" },
    system: [{ type: "text", text: TRANSCRIPT_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: transcriptUserMessage(input) }],
  });
  
  yield { type: "step", step: "script", status: "active", progress: 0 };

  let header: Omit<Transcript, "segments"> | undefined;
  let lineNumber = 0;
  let reported = 0;

  for await (const line of lines(stream)) {
    lineNumber++;
    const trimmed = line.trim();
    // Tolerate blank lines and a stray code fence around the output.
    if (!trimmed || trimmed.startsWith("```")) continue;
    let parsed: z.infer<typeof TranscriptLineSchema>;
    try {
      parsed = TranscriptLineSchema.parse(JSON.parse(trimmed));
    } catch (error) {
      throw new Error(`Transcript line ${lineNumber} was not valid: ${error instanceof Error ? error.message : error}`);
    }
    // Parsing with the stored schemas strips the line-only fields (type, percentComplete).
    if (parsed.type === "header") {
      header = TranscriptSchema.omit({ segments: true }).parse(parsed);
      yield { type: "content", content: parsed };
      continue;
    } else {
      // content type must be segment
      yield { type: "content", content: { ...parsed, type: "segment", percentComplete: parsed.percentComplete } };
    }
    
    const progress = Math.min(Math.max(parsed.percentComplete / 100, reported), 0.95);
    if (progress > reported) {
      reported = progress;
      yield { type: "step", step: "script", status: "active", progress };
    }
  }

  const message = await stream.finalMessage();

  if (message.stop_reason === "refusal") {
    throw new Error(`Transcript request was declined: ${message.stop_details?.explanation ?? "no explanation"}`);
  }
  if (message.stop_reason === "max_tokens") {
    throw new Error("Transcript was cut off at max_tokens.");
  }
}
