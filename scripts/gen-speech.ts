import { readFile } from "node:fs/promises";
import { voiceTranscript } from "@/lib/generation/pipeline";
import { DEFAULT_TTS_MODEL } from "@/lib/generation/speech";
import { TranscriptSchema } from "@/lib/generation/transcript";
import { args, logStep, minutes, run, vibe } from "./cli";

run(async () => {
  const usage = `npm run gen:speech -- --transcript out/transcripts/<file>.json --voice <voiceId> [--model ${DEFAULT_TTS_MODEL}] [--vibe tide] [--detail "tropical"]`;
  const flags = args(
    usage,
    {
      transcript: { type: "string" },
      voice: { type: "string" },
      model: { type: "string" },
      vibe: { type: "string" },
      detail: { type: "string" },
    },
    ["transcript", "voice"],
  );
  const chosen = vibe(flags.vibe, usage);

  const transcript = TranscriptSchema.parse(JSON.parse(await readFile(flags.transcript!, "utf8")));
  const session = await voiceTranscript(
    transcript,
    { voiceId: flags.voice!, modelId: flags.model },
    logStep,
    chosen ? { vibe: chosen, detail: flags.detail } : undefined,
  );

  console.log(`  ${session.transcript.title}: ${minutes(session.duration)} (target ${transcript.minutes}:00), ${session.characters} characters`);
  console.log(`  Audio:   ${session.audioUrl}`);
  if (session.musicUrl) console.log(`  Music:   ${session.musicUrl}`);
  console.log(`  Session: ${session.sessionUrl}`);
});
