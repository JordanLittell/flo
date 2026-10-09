import { ElevenLabsClient, ElevenLabsError } from "@elevenlabs/elevenlabs-js";
import { PCM_FORMAT, pcmDuration, silence } from "./audio";
import type { Segment, Transcript } from "./transcript";

/** Highest-quality ElevenLabs model per the text-to-speech skill. */
export const DEFAULT_TTS_MODEL = "eleven_v4";

// maximum number of concurrent requests to ElevenLabs
// currently ElevenLabs has a limit of 4 concurrent requests
const CONCURRENCY = 2;

// attempts per segment when ElevenLabs rate-limits us
const MAX_ATTEMPTS = 3;

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

/** Voices one segment, waiting out ElevenLabs rate limits a few times before giving up. */
async function synthesizeWithRetry(
  text: string,
  options: SpeechOptions & { previousText?: string; nextText?: string },
  client: ElevenLabsClient,
): Promise<Buffer> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await synthesizeSegment(text, options, client);
    } catch (error) {
      if (error instanceof ElevenLabsError && error.statusCode === 429 && attempt < MAX_ATTEMPTS) {
        console.warn(`Rate limit exceeded, waiting 3 seconds before retrying...`);
        await new Promise(resolve => setTimeout(resolve, 3 * 1000));
        continue;
      }
      throw error;
    }
  }
}

/** Runs at most `concurrency` tasks at once; the rest wait their turn in order. */
function limiter(concurrency: number) {
  let active = 0;
  const queue: (() => void)[] = [];
  return async function limit<T>(task: () => Promise<T>): Promise<T> {
    if (active >= concurrency) await new Promise<void>(resolve => queue.push(resolve));
    active++;
    try {
      return await task();
    } finally {
      active--;
      queue.shift()?.();
    }
  };
}

export interface SpeechSynthesizer {
  /** Adds the next segment. The previous one is voiced now that its nextText is known. */
  push(segment: Segment): void;
  /** Voices the last segment, waits for every clip, and joins them in order. */
  finish(): Promise<SpeechResult>;
}

/**
 * Voices segments as they arrive (a few at a time), so speech can start while the script is still
 * streaming. Each segment waits for the one after it so previousText/nextText keep prosody continuous.
 */
export function createSpeechSynthesizer(
  options: SpeechOptions,
  onProgress?: (done: number) => void,
): SpeechSynthesizer {
  const client = new ElevenLabsClient();
  const limit = limiter(CONCURRENCY);
  const segments: Segment[] = [];
  const clips: Promise<Buffer>[] = [];
  let done = 0;

  function dispatch(index: number) {
    const clip = limit(() =>
      synthesizeWithRetry(
        segments[index].text,
        { ...options, previousText: segments[index - 1]?.text, nextText: segments[index + 1]?.text },
        client,
      ),
    ).then(buffer => {
      onProgress?.(++done);
      return buffer;
    });
    // finish() surfaces the failure; this keeps it from being unhandled while the script still streams.
    clip.catch(error => console.error(`Unexpected error synthesizing segment ${index}:`, error));
    clips[index] = clip;
  }

  return {
    push(segment) {
      segments.push(segment);
      if (segments.length > 1) dispatch(segments.length - 2);
    },

    async finish() {
      if (segments.length > 0) dispatch(segments.length - 1);
      const buffers = await Promise.all(clips);

      const parts: Buffer[] = [];
      const timeline: TimelineEntry[] = [];
      let cursor = 0;
      segments.forEach((segment, index) => {
        const speech = pcmDuration(buffers[index]);
        timeline.push({ index, pose: segment.pose, kind: segment.kind, text: segment.text, start: cursor, end: cursor + speech });
        const gap = silence(segment.pauseAfterSeconds);
        parts.push(buffers[index], gap);
        cursor += speech + pcmDuration(gap);
      });

      const pcm = Buffer.concat(parts);
      return {
        pcm,
        timeline,
        duration: pcmDuration(pcm),
      };
    },
  };
}

/**
 * Voices every segment of a finished transcript, then joins them in order with the exact silence each
 * segment asks for. The timeline is measured from the real audio, so it is what the player should use.
 */
export async function synthesizeTranscript(
  transcript: Transcript,
  options: SpeechOptions,
  onProgress?: (done: number, total: number) => void,
): Promise<SpeechResult> {
  const { segments } = transcript;
  const synthesizer = createSpeechSynthesizer(options, done => onProgress?.(done, segments.length));
  segments.forEach(segment => synthesizer.push(segment));
  return synthesizer.finish();
}
