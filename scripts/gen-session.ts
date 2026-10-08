import { generateSession } from "@/lib/generation/pipeline";
import { DEFAULT_TTS_MODEL } from "@/lib/generation/speech";
import { args, describeTranscript, logStep, minutes, run, saveTranscript, vibe } from "./cli";

run(async () => {
  const usage = `npm run gen:session -- --prompt "hip openers for runners" --voice <voiceId> [--minutes 20] [--level Beginner] [--model ${DEFAULT_TTS_MODEL}] [--vibe tide] [--detail "tropical"]`;
  const flags = args(
    usage,
    {
      prompt: { type: "string" },
      voice: { type: "string" },
      minutes: { type: "string", default: "20" },
      level: { type: "string" },
      model: { type: "string" },
      vibe: { type: "string" },
      detail: { type: "string" },
    },
    ["prompt", "voice"],
  );
  const chosen = vibe(flags.vibe, usage);

  const session = await generateSession(
    { prompt: flags.prompt!, minutes: Number(flags.minutes), level: flags.level },
    { voiceId: flags.voice!, modelId: flags.model },
    logStep,
    chosen ? { vibe: chosen, detail: flags.detail } : undefined,
  );
  const file = await saveTranscript(session.transcript);

  describeTranscript(session.transcript);
  console.log(`  Voiced ${minutes(session.duration)} (target ${session.transcript.minutes}:00), ${session.characters} characters`);
  console.log(`  Transcript: ${file}`);
  console.log(`  Audio:      ${session.audioUrl}`);
  if (session.musicUrl) console.log(`  Music:      ${session.musicUrl}`);
  console.log(`  Session:    ${session.sessionUrl}`);
});
