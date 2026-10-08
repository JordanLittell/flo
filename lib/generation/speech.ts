import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { PCM_FORMAT, pcmDuration, silence } from "./audio";
import type { Segment, Transcript } from "./transcript";

/** Highest-quality ElevenLabs model per the text-to-speech skill. */
export const DEFAULT_TTS_MODEL = "eleven_v4";
const CONCURRENCY = 4;

export interface SpeechOptions {
  voiceId: string;
  modelId?: string;
}

export interface TimelineEntry {
  index: number;
  pose: string | null;
  kind: Segment["kind"];
  text: string;
  /** Seconds from the start of the class when this segment's speech starts and ends. */
  start: number;
  end: number;
}

export interface SpeechResult {
  pcm: Buffer;
  timeline: TimelineEntry[];
  duration: number;
  characters: number;
}

/** Voices one passage and returns raw PCM. previousText/nextText keep prosody continuous across segments. */
export async function synthesizeSegment(
  text: string,
  options: SpeechOptions & { previousText?: string; nextText?: string },
  client = new ElevenLabsClient(),
): Promise<Buffer> {
  const audio = await client.textToSpeech.convert(
    options.voiceId,
    {
      text,
      modelId: options.modelId ?? DEFAULT_TTS_MODEL,
      outputFormat: PCM_FORMAT,
      previousText: options.previousText,
      nextText: options.nextText,
    },
    { maxRetries: 4, timeoutInSeconds: 120 },
  );
  return Buffer.from(await new Response(audio).arrayBuffer());
}

/**
 * Voices every segment (a few at a time), then joins them in order with the exact silence each
 * segment asks for. The timeline is measured from the real audio, so it is what the player should use.
 */
export async function synthesizeTranscript(
  transcript: Transcript,
  options: SpeechOptions,
  onProgress?: (done: number, total: number) => void,
): Promise<SpeechResult> {
  const client = new ElevenLabsClient();
  const { segments } = transcript;
  const clips: Buffer[] = new Array(segments.length);
  let next = 0;
  let done = 0;

  async function worker() {
    while (next < segments.length) {
      const index = next++;
      clips[index] = await synthesizeSegment(
        segments[index].text,
        { ...options, previousText: segments[index - 1]?.text, nextText: segments[index + 1]?.text },
        client,
      );
      onProgress?.(++done, segments.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, segments.length) }, worker));

  const parts: Buffer[] = [];
  const timeline: TimelineEntry[] = [];
  let cursor = 0;
  segments.forEach((segment, index) => {
    const speech = pcmDuration(clips[index]);
    timeline.push({ index, pose: segment.pose, kind: segment.kind, text: segment.text, start: cursor, end: cursor + speech });
    const gap = silence(segment.pauseAfterSeconds);
    parts.push(clips[index], gap);
    cursor += speech + pcmDuration(gap);
  });

  const pcm = Buffer.concat(parts);
  return {
    pcm,
    timeline,
    duration: pcmDuration(pcm),
    characters: segments.reduce((total, segment) => total + segment.text.length, 0),
  };
}
