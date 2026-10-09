import { z } from "zod";
import { VIBES, type Vibe } from "@/components/vibes";
import { INSTRUCTORS, LEVELS } from "@/lib/instructors";
import type { StepEvent } from "./pipeline";

/** What the home screen sends to start a generated session. Shared by the route and the client. */
export const SessionRequestSchema = z.object({
  prompt: z.string().trim().min(1).max(500),
  minutes: z.number().int().min(5).max(60),
  vibe: z.enum(Object.keys(VIBES) as [Vibe, ...Vibe[]]),
  level: z.enum(LEVELS),
  // Only the offered instructors, so the endpoint can't be used with arbitrary voices.
  voiceId: z.enum(INSTRUCTORS.map((instructor) => instructor.voiceId) as [string, ...string[]]),
});

export type SessionRequest = z.infer<typeof SessionRequestSchema>;

/** One line of the newline-delimited JSON stream the generation route sends back. 
 * We read the stream in the browser and update a loader based on how far we are through the generation. 
 * Once the generation is complete (we encounter done) we redirect to the session page.
*/

export type GenerationEvent =
  | ({ type: "step" } & StepEvent)
  | { type: "done"; sessionId: string }
  | { type: "error"; message: string };

/** Default length when the time filter is "Any length". */
export const DEFAULT_MINUTES = 20;
