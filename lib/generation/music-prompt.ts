import { VIBES, type Vibe } from "@/components/vibes";

/** Musical direction per vibe. No artist names: the music API rejects them. */
export const VIBE_MUSIC: Record<Vibe, string> = {
  tide: "warm, slow and airy: soft synth pads, gentle felt piano, distant ocean-like swells, around 60 BPM",
  haze: "drifting ambient textures with no clear beat: evolving pads, soft shimmer, long reverb tails",
  sunrise: "bright and gently uplifting: light acoustic guitar, soft marimba, a calm steady pulse around 80 BPM",
  moss: "low and earthy: warm drones, soft hand drums, wooden flute, unhurried and grounded, around 65 BPM",
};

const SHARED =
  "Instrumental background music for a guided yoga class. It sits quietly under a speaking voice, so keep the midrange uncluttered and the dynamics even. Steady and calm throughout: no drops, no build-ups, no sudden changes, no vocals.";

/** Builds the composition prompt for a session loop; `detail` is a finer style choice such as "tropical". */
export function musicPrompt(vibe: Vibe, detail?: string): string {
  return [
    `${VIBES[vibe]} mood: ${VIBE_MUSIC[vibe]}.`,
    detail ? `Style detail: ${detail}.` : null,
    SHARED,
    "Begin with a soft fade in and end with a soft fade out so the piece loops smoothly.",
  ]
    .filter(Boolean)
    .join(" ");
}
