import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { run } from "./cli";

// Lists the ElevenLabs voices available to this account, to pick a --voice for the other scripts.
run(async () => {
  const client = new ElevenLabsClient();
  const { voices } = await client.voices.getAll();
  for (const voice of voices) {
    const labels = Object.values(voice.labels ?? {}).join(", ");
    console.log(`${voice.voiceId}  ${voice.name ?? ""}${labels ? `  (${labels})` : ""}`);
  }
});
