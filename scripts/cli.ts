import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { VIBES, type Vibe } from "@/components/vibes";
import type { StepEvent } from "@/lib/generation/pipeline";
import { estimateSeconds, type Transcript } from "@/lib/generation/transcript";

/** Parses string --flags; prints usage and exits 1 when a required one is missing. */
export function args<K extends string>(
  usage: string,
  options: Record<K, { type: "string"; default?: string }>,
  required: NoInfer<K>[],
): Record<K, string | undefined> {
  const { values } = parseArgs({ options, strict: true });
  const flags = values as unknown as Record<K, string | undefined>;
  const missing = required.filter((name) => flags[name] === undefined);
  if (missing.length) {
    console.error(`Missing ${missing.map((name) => `--${name}`).join(", ")}\n\nUsage: ${usage}`);
    process.exit(1);
  }
  return flags;
}

export function minutes(seconds: number): string {
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

export function slug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function saveTranscript(transcript: Transcript): Promise<string> {
  const dir = path.join("out", "transcripts");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${slug(transcript.title)}.json`);
  await writeFile(file, JSON.stringify(transcript, null, 2));
  return file;
}

export function describeTranscript(transcript: Transcript) {
  const poses = new Set(transcript.segments.map((segment) => segment.pose).filter(Boolean));
  console.log(`  ${transcript.title} · ${transcript.level} · ${transcript.minutes} min`);
  console.log(`  ${transcript.segments.length} segments, ${poses.size} poses, estimated ${minutes(estimateSeconds(transcript))}`);
}

/** Validates a --vibe value against the design system's vibes. */
export function vibe(value: string | undefined, usage: string): Vibe | undefined {
  if (value === undefined) return undefined;
  if (Object.hasOwn(VIBES, value)) return value as Vibe;
  const allowed = Object.entries(VIBES)
    .map(([id, name]) => `${id} (${name})`)
    .join(", ");
  console.error(`Unknown --vibe "${value}". Use one of: ${allowed}\n\nUsage: ${usage}`);
  process.exit(1);
}

const LABELS = {
  script: "Designing your flow",
  voice: "Recording your instructor",
  music: "Composing your music",
  finish: "Getting everything ready",
};

let progressLineOpen = false;

/** Prints pipeline steps with the same labels the PrepareLoader uses. */
export function logStep(event: StepEvent) {
  if (event.step === "voice" && event.status === "active" && event.total) {
    process.stdout.write(`\r${LABELS.voice}… ${event.done}/${event.total} segments`);
    progressLineOpen = event.done !== event.total;
    if (!progressLineOpen) process.stdout.write("\n");
    return;
  }
  const line =
    event.status === "active" ? `${LABELS[event.step]}…` : event.step === "music" ? `${LABELS.music}: done` : null;
  if (!line) return;
  // Steps can finish while the voice progress line is still being rewritten.
  if (progressLineOpen) process.stdout.write("\n");
  console.log(line);
}

/** Runs a script's main function and exits non-zero with a readable message on failure. */
export function run(main: () => Promise<void>) {
  main().catch((error: unknown) => {
    console.error(`\n${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
