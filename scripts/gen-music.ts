import { randomBytes } from "node:crypto";
import { composeMusic, DEFAULT_LOOP_SECONDS } from "@/lib/generation/music";
import { uploadPublic } from "@/lib/generation/storage";
import { args, logStep, minutes, run, vibe } from "./cli";

// Composes one session music loop for a vibe, to test music on its own.
run(async () => {
  const usage = `npm run gen:music -- --vibe tide [--detail "tropical"] [--seconds ${DEFAULT_LOOP_SECONDS}]`;
  const flags = args(
    usage,
    { vibe: { type: "string" }, detail: { type: "string" }, seconds: { type: "string", default: String(DEFAULT_LOOP_SECONDS) } },
    ["vibe"],
  );
  const chosen = vibe(flags.vibe, usage)!;

  logStep({ step: "music", status: "active" });
  const music = await composeMusic({ vibe: chosen, use: "loop", seconds: Number(flags.seconds), detail: flags.detail });
  const url = await uploadPublic(`music/${chosen}-${randomBytes(4).toString("hex")}.mp3`, music.mp3, "audio/mpeg");

  console.log(`  ${minutes(Number(flags.seconds))} requested, ${(music.mp3.length / 1e6).toFixed(1)} MB`);
  console.log(`  Prompt: ${music.prompt}`);
  console.log(`  Music:  ${url}`);
});
