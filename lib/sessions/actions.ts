"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/access";
import { UserSession } from "@/lib/data";

/** Records that the signed-in user started (or restarted) a session from the beginning. */
export async function startSession(sessionId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !z.uuid().safeParse(sessionId).success) return;
  await UserSession.start(user.id, sessionId);
}

/** Marks the signed-in user's session completed. */
export async function completeSession(sessionId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !z.uuid().safeParse(sessionId).success) return;
  await UserSession.complete(user.id, sessionId);
}
