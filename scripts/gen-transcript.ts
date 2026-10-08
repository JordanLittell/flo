import { generateTranscript } from "@/lib/generation/transcript";
import { args, describeTranscript, logStep, run, saveTranscript } from "./cli";

run(async () => {
  const flags = args(
    'npm run gen:transcript -- --prompt "hip openers for runners" [--minutes 20] [--level Beginner]',
    { prompt: { type: "string" }, minutes: { type: "string", default: "20" }, level: { type: "string" } },
    ["prompt"],
  );

  logStep({ step: "script", status: "active" });
  const transcript = await generateTranscript({
    prompt: flags.prompt!,
    minutes: Number(flags.minutes),
    level: flags.level,
  });
  const file = await saveTranscript(transcript);

  describeTranscript(transcript);
  console.log(`  Saved ${file}`);
});
