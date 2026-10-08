import { randomBytes } from "node:crypto";
import type { Vibe } from "@/components/vibes";
import { pcmToMp3 } from "./audio";
import { composeMusic, DEFAULT_LOOP_SECONDS } from "./music";
import { DEFAULT_TTS_MODEL, synthesizeTranscript, type SpeechOptions } from "./speech";
import { uploadSession, type StoredSession } from "./storage";
import { generateTranscript, type Transcript, type TranscriptInput } from "./transcript";

/** Step ids match the PrepareLoader's steps in the design system. */
export type StepEvent =
  | { step: "script"; status: "active" | "done" }
  | { step: "voice"; status: "active" | "done"; done?: number; total?: number }
  | { step: "music"; status: "active" | "done" }
  | { step: "finish"; status: "active" | "done" };

export interface MusicOptions {
  vibe: Vibe;
  /** Finer style choice within the vibe, e.g. "tropical". */
  detail?: string;
}

export interface VoicedSession extends StoredSession {
  id: string;
  transcript: Transcript;
  duration: number;
  characters: number;
}

export function sessionId(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${slug}-${randomBytes(4).toString("hex")}`;
}

/** Voices an existing transcript, composes its music loop at the same time if asked, and stores both. */
export async function voiceTranscript(
  transcript: Transcript,
  options: SpeechOptions,
  onStep?: (event: StepEvent) => void,
  music?: MusicOptions,
): Promise<VoicedSession> {
  const modelId = options.modelId ?? DEFAULT_TTS_MODEL;

  const voice = (async () => {
    onStep?.({ step: "voice", status: "active", done: 0, total: transcript.segments.length });
    const speech = await synthesizeTranscript(transcript, { ...options, modelId }, (done, total) =>
      onStep?.({ step: "voice", status: "active", done, total }),
    );
    onStep?.({ step: "voice", status: "done" });
    return speech;
  })();

  const loop = music
    ? (async () => {
        onStep?.({ step: "music", status: "active" });
        const composed = await composeMusic({ ...music, use: "loop", seconds: DEFAULT_LOOP_SECONDS });
        onStep?.({ step: "music", status: "done" });
        return composed.mp3;
      })()
    : undefined;

  const [speech, musicMp3] = await Promise.all([voice, loop]);

  onStep?.({ step: "finish", status: "active" });
  const id = sessionId(transcript.title);
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
      vibe: music?.vibe,
      transcript,
      timeline: speech.timeline,
    },
  });
  onStep?.({ step: "finish", status: "done" });

  return { id, transcript, duration: speech.duration, characters: speech.characters, ...stored };
}

/** The whole pipeline: script, then voice (and music, in parallel), then storage. */
export async function generateSession(
  input: TranscriptInput,
  options: SpeechOptions,
  onStep?: (event: StepEvent) => void,
  music?: MusicOptions,
): Promise<VoicedSession> {
  onStep?.({ step: "script", status: "active" });
  const transcript = await generateTranscript(input);
  onStep?.({ step: "script", status: "done" });
  return voiceTranscript(transcript, options, onStep, music);
}
