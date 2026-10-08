import { ElevenLabsClient, ElevenLabsError } from "@elevenlabs/elevenlabs-js";
import type { Vibe } from "@/components/vibes";
import { musicPrompt, type MusicUse } from "./music-prompt";

/** Most advanced ElevenLabs music model, per the music skill. */
export const DEFAULT_MUSIC_MODEL = "music_v2_5";
/** Session music is one loop the player repeats; the API caps a track at 10 minutes. */
export const DEFAULT_LOOP_SECONDS = 240;
export const SAMPLE_SECONDS = 30;

export interface MusicRequest {
  vibe: Vibe;
  use: MusicUse;
  seconds: number;
  /** Finer style choice within the vibe, e.g. "tropical". */
  detail?: string;
}

export interface ComposedMusic {
  mp3: Buffer;
  prompt: string;
}

/** Composes an instrumental track and returns ElevenLabs' own MP3 (48 kHz, 192 kbps). */
export async function composeMusic(request: MusicRequest, client = new ElevenLabsClient()): Promise<ComposedMusic> {
  const prompt = musicPrompt(request.vibe, request.use, request.detail);
  const seconds = Math.min(Math.max(request.seconds, 3), 600);
  try {
    const audio = await client.music.compose(
      {
        prompt,
        musicLengthMs: Math.round(seconds * 1000),
        modelId: DEFAULT_MUSIC_MODEL,
        forceInstrumental: true,
        outputFormat: "mp3_48000_192",
      },
      { maxRetries: 3, timeoutInSeconds: 600 },
    );
    return { mp3: Buffer.from(await new Response(audio).arrayBuffer()), prompt };
  } catch (error) {
    // A rejected prompt comes back with a suggested rewrite; surface it so the prompt can be fixed.
    if (error instanceof ElevenLabsError && JSON.stringify(error.body ?? "").includes("prompt_suggestion")) {
      throw new Error(`Music prompt rejected: ${JSON.stringify(error.body)}\nPrompt: ${prompt}`);
    }
    throw error;
  }
}
