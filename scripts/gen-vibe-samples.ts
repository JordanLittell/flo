import { VIBES, type Vibe } from "@/components/vibes";
import { composeMusic, SAMPLE_SECONDS } from "@/lib/generation/music";
import { uploadPublic } from "@/lib/generation/storage";
import { args, run, vibe } from "./cli";

// Composes the short preview each vibe pill plays, at a fixed path per vibe (reruns replace them).
run(async () => {
  const usage = "npm run gen:vibe-samples [-- --vibe tide]";
  const flags = args(usage, { vibe: { type: "string" } }, []);
  const only = vibe(flags.vibe, usage);
  const vibes = only ? [only] : (Object.keys(VIBES) as Vibe[]);

  for (const id of vibes) {
    console.log(`Composing ${VIBES[id]} sample…`);
    const music = await composeMusic({ vibe: id, use: "sample", seconds: SAMPLE_SECONDS });
    const url = await uploadPublic(`vibes/${id}/sample.mp3`, music.mp3, "audio/mpeg", { overwrite: true });
    console.log(`  ${url}`);
  }
});
