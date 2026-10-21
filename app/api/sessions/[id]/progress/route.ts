import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/access";
import { UserSession } from "@/lib/data";

const ProgressSchema = z.object({ position: z.number().min(0) });

/**
 * Saves where the signed-in user is in a started session. A route rather than a Server Action so the
 * player can send it with navigator.sendBeacon while the page is closing.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/sessions/[id]/progress">) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });

  const { id } = await ctx.params;
  const parsed = ProgressSchema.safeParse(await request.json().catch(() => null));
  if (!z.uuid().safeParse(id).success || !parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  await UserSession.saveProgress(user.id, id, parsed.data.position);
  return new Response(null, { status: 204 });
}
