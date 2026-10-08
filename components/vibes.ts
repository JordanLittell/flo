export type Vibe = "tide" | "haze" | "sunrise" | "moss";

/** Display names. Vibes are never conveyed by colour alone. */
export const VIBES: Record<Vibe, string> = {
  tide: "Chill",
  haze: "Ambient",
  sunrise: "Uplifting",
  moss: "Grounding",
};
