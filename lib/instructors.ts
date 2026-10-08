/**
 * Instructor voices offered in the app: ElevenLabs premade voices chosen for calm, warm delivery.
 * Two female and two male, per product decision.
 */
export interface Instructor {
  voiceId: string;
  name: string;
  gender: "female" | "male";
  description: string;
}

export const INSTRUCTORS: Instructor[] = [
  { voiceId: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", gender: "female", description: "Soft and reassuring" },
  { voiceId: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", gender: "female", description: "Warm and gentle" },
  { voiceId: "nPczCjzI2devNBz1zQrb", name: "Brian", gender: "male", description: "Deep and calming" },
  { voiceId: "JBFqnCBsd6RMkjVDRZzb", name: "George", gender: "male", description: "Warm and steady" },
];

export const LEVELS = ["All levels", "Beginner", "Intermediate", "Advanced"] as const;
export type Level = (typeof LEVELS)[number];
