import { randomBytes } from "node:crypto";
import type { Vibe } from "@/components/vibes";
import { Session } from "@/lib/data";
import { pcmToMp3 } from "./audio";
import { composeMusic, DEFAULT_LOOP_SECONDS } from "./music";
import { createSpeechSynthesizer, DEFAULT_TTS_MODEL, type SpeechOptions } from "./speech";
import { uploadSession } from "./storage";
import { generateTranscript, Segment, Transcript, type TranscriptInput } from "./transcript";
import { GenerationEvent } from "./request";

/** Step ids match the PrepareLoader's steps in the design system. */
export type StepEvent =
  | { step: "script"; status: "active" | "done"; progress: number }
  | { step: "voice"; status: "active" | "done"; done?: number; total?: number }
  | { step: "music"; status: "active" | "done" }
  | { step: "saving"; status: "active" | "done" };

export interface MusicOptions {
  vibe: Vibe;
  /** Finer style choice within the vibe, e.g. "tropical". */
  detail?: string;
}

function sessionSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${slug}-${randomBytes(4).toString("hex")}`;
}

/**
 * The whole pipeline: music starts straight away, each script segment is voiced as soon as it streams in,
 * then Blob storage and the session row.
 */
export async function *generateSession(
  input: TranscriptInput,
  options: SpeechOptions & { createdBy?: string },
  music: MusicOptions,
): AsyncGenerator<GenerationEvent, Session, undefined> {
  yield { type: "step", step: "script", status: "active", progress: 0 };

  // The music loop doesn't depend on the script, so it runs alongside everything else.
  yield { type: "step", step: "music", status: "active" };
  const loop = composeMusic({ ...music, seconds: DEFAULT_LOOP_SECONDS }).then(composed => {
    const musicMp3 = composed.mp3;
    return musicMp3;
  });
  

  loop.catch(() => {}); // surfaced by the Promise.all below

  const modelId = options.modelId ?? DEFAULT_TTS_MODEL;
  const voice = createSpeechSynthesizer({ ...options, modelId });
  let voiceStarted = false;

  const segments: Segment[] = [];
  let header: Omit<Transcript, "segments"> | undefined;
  for await (const transcriptFragment of generateTranscript(input)) {
    switch (transcriptFragment.type) {
      case "step":
        console.log("[pipeline] step:", transcriptFragment.progress);
        yield { type: "step", step: "script", status: "active", progress: transcriptFragment.progress };
        break;
      case "content":
        switch (transcriptFragment.content.type) {
          case "segment": {
            const { pose, kind, text, pauseAfterSeconds } = transcriptFragment.content;
            const segment: Segment = { pose, kind, text, pauseAfterSeconds };
            segments.push(segment);
            voice.push(segment);
            if (!voiceStarted) {
              voiceStarted = true;
              yield { type: "step", step: "voice", status: "active" };
            }
            break;
          }
          case "header":
            header = transcriptFragment.content;
            break;
        }
        break;
    }
  }

  yield { type: "step", step: "script", status: "done", progress: 100 };

  const transcript: Transcript = { ...header, segments } as Transcript;
  const [speech, musicMp3] = await Promise.all([voice.finish(), loop]);

  yield { type: "step", step: "voice", status: "done" };
  yield { type: "step", step: "music", status: "done" };

  yield { type: "step", step: "saving", status: "active" };
  
  const id = sessionSlug(transcript.title);
  const stored = await uploadSession({
    id,
    mp3: await pcmToMp3(speech.pcm),
    music: musicMp3,
    manifest: {
      id,
      createdAt: new Date().toISOString(),
      voiceId: options.voiceId,
      modelId,
      duration: speech.duration,
      vibe: music.vibe,
      transcript,
      timeline: speech.timeline,
    },
  });
  const session = await Session.create({
    slug: id,
    createdBy: options.createdBy ?? null,
    prompt: input.prompt,
    title: transcript.title,
    minutes: transcript.minutes,
    level: transcript.level,
    vibe: music.vibe,
    voiceId: options.voiceId,
    audioUrl: stored.musicUrl ?? null,
    instructorAudioUrl: stored.audioUrl,
    transcriptUrl: stored.transcriptUrl,
    manifestUrl: stored.sessionUrl,
    duration: speech.duration,
  });
  yield { type: "done", sessionId: session.id };

  return session;
}
