import type { Vibe } from "@/components/vibes";

export type Level = "Beginner" | "Intermediate" | "Advanced" | "All levels";

/** A curated, pre-written template shown under "Popular flows". */
export interface PopularFlow {
  id: string;
  title: string;
  minutes: number;
  level: Level;
  poses: number;
  vibe: Vibe;
  tag?: string;
}

/** A session generated from an earlier prompt. Only the generated title is public: no author, no prompt. */
export interface CommunityFlow {
  id: string;
  title: string;
  minutes: number;
  level: Level;
  poses: number;
  vibe: Vibe;
}

// Placeholder data for the visual pass; replaced by Supabase later.
export const POPULAR_FLOWS: PopularFlow[] = [
  { id: "p1", title: "Slow Sunday Unwind", minutes: 20, level: "Beginner", poses: 14, vibe: "haze", tag: "Popular" },
  { id: "p2", title: "Rooted Hips", minutes: 30, level: "All levels", poses: 18, vibe: "moss" },
  { id: "p3", title: "Desk Body Reset", minutes: 10, level: "Beginner", poses: 8, vibe: "tide", tag: "New" },
  { id: "p4", title: "Morning Sun Salutations", minutes: 20, level: "Intermediate", poses: 16, vibe: "sunrise", tag: "Popular" },
  { id: "p5", title: "Deep Hamstring Release", minutes: 45, level: "Intermediate", poses: 22, vibe: "tide" },
  { id: "p6", title: "Strong Standing Flow", minutes: 60, level: "Advanced", poses: 30, vibe: "sunrise" },
];

export const COMMUNITY_FLOWS: CommunityFlow[] = [
  { id: "c1", title: "Runner's Calf and Hip Opener", minutes: 20, level: "All levels", poses: 13, vibe: "moss" },
  { id: "c2", title: "Gentle Lower Back Relief", minutes: 10, level: "Beginner", poses: 7, vibe: "haze" },
  { id: "c3", title: "Bright Lunchtime Energizer", minutes: 30, level: "Intermediate", poses: 19, vibe: "sunrise" },
  { id: "c4", title: "Quiet Wind-Down Before Sleep", minutes: 45, level: "Beginner", poses: 15, vibe: "tide" },
];

/** Which TimeFilter option a flow of this length falls under. */
export function lengthBucket(minutes: number): string {
  if (minutes < 15) return "10";
  if (minutes < 25) return "20";
  if (minutes < 40) return "30";
  return "45";
}
