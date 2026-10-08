import type { TimelineEntry } from "@/lib/generation/speech";

export interface Hold {
  pose: string | null;
  start: number;
  end: number;
}

export interface ClassState {
  pose: string | null;
  cue: string | null;
  next: string | null;
  holdRemaining: number;
  holdTotal: number;
}

/** Groups consecutive timeline entries with the same pose into holds that run until the next pose starts. */
export function holdsFrom(timeline: TimelineEntry[], duration: number): Hold[] {
  const holds: Hold[] = [];
  for (const entry of timeline) {
    const last = holds.at(-1);
    if (last && last.pose === entry.pose) continue;
    if (last) last.end = entry.start;
    holds.push({ pose: entry.pose, start: entry.start, end: duration });
  }
  return holds;
}

/** What the class screen shows at a moment: current pose and cue, the next pose, and the hold countdown. */
export function classStateAt(timeline: TimelineEntry[], holds: Hold[], elapsed: number): ClassState {
  const cue = timeline.findLast((entry) => entry.start <= elapsed) ?? timeline[0];
  const index = Math.max(
    holds.findLastIndex((hold) => hold.start <= elapsed),
    0,
  );
  const hold = holds[index];
  const next = holds.slice(index + 1).find((later) => later.pose !== null);
  return {
    pose: hold?.pose ?? null,
    cue: cue?.text ?? null,
    next: next?.pose ?? null,
    holdRemaining: hold ? Math.max(hold.end - elapsed, 0) : 0,
    holdTotal: hold ? hold.end - hold.start : 0,
  };
}
