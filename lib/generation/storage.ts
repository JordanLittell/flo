import { put } from "@vercel/blob";
import type { Vibe } from "@/components/vibes";
import type { TimelineEntry } from "./speech";
import type { Transcript } from "./transcript";

export interface StoredSession {
  audioUrl: string;
  musicUrl?: string;
  transcriptUrl: string;
  sessionUrl: string;
}

export interface SessionManifest {
  id: string;
  createdAt: string;
  voiceId: string;
  modelId: string;
  duration: number;
  audioUrl: string;
  /** A loop the player repeats under the voice. */
  musicUrl?: string;
  vibe?: Vibe;
  transcript: Transcript;
  timeline: TimelineEntry[];
}

/** Uploads one public file to Vercel Blob. */
async function uploadPublic(pathname: string, body: Buffer | string, contentType: string): Promise<string> {
  const blob = await put(pathname, body, { access: "public", contentType });
  return blob.url;
}

/** Uploads a session's voice track, optional music loop, transcript, and manifest (transcript + timeline). */
export async function uploadSession(input: {
  id: string;
  mp3: Buffer;
  music?: Buffer;
  manifest: Omit<SessionManifest, "audioUrl" | "musicUrl">;
}): Promise<StoredSession> {
  const [audioUrl, musicUrl, transcriptUrl] = await Promise.all([
    uploadPublic(`sessions/${input.id}/voice.mp3`, input.mp3, "audio/mpeg"),
    input.music ? uploadPublic(`sessions/${input.id}/music.mp3`, input.music, "audio/mpeg") : undefined,
    uploadPublic(
      `sessions/${input.id}/transcript.json`,
      JSON.stringify(input.manifest.transcript, null, 2),
      "application/json",
    ),
  ]);
  const manifest: SessionManifest = { ...input.manifest, audioUrl, musicUrl };
  const sessionUrl = await uploadPublic(
    `sessions/${input.id}/session.json`,
    JSON.stringify(manifest, null, 2),
    "application/json",
  );
  return { audioUrl, musicUrl, transcriptUrl, sessionUrl };
}
