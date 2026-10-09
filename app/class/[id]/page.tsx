import { z } from "zod";
import ClassScreen from "@/components/ClassScreen/ClassScreen";
import { requireUser } from "@/lib/auth/access";
import { Session } from "@/lib/data";
import type { SessionManifest } from "@/lib/generation/storage";
import styles from "./page.module.css";

/** Only our public Blob store is fetched or played, so the page never loads arbitrary URLs. */
function blobUrl(value: string | null): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".public.blob.vercel-storage.com") ? url.href : undefined;
  } catch {
    return undefined;
  }
}

async function loadManifest(url: string): Promise<SessionManifest | null> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return null;
  const manifest = (await response.json()) as SessionManifest;
  return blobUrl(manifest.audioUrl) && Array.isArray(manifest.timeline) ? manifest : null;
}

export default async function ClassPage({ params }: PageProps<"/class/[id]">) {
  await requireUser();
  const { id } = await params;
  // Checked first: Postgres rejects a malformed uuid with an error rather than no rows.
  const session = z.uuid().safeParse(id).success ? await Session.findById(id) : null;
  const manifestUrl = session && blobUrl(session.manifestUrl);
  const manifest = manifestUrl ? await loadManifest(manifestUrl) : null;

  if (!session || !manifest) {
    return (
      <main className={styles.missing}>
        <h1>Session not found</h1>
        <p>This class doesn&apos;t exist or is no longer available.</p>
      </main>
    );
  }

  return <ClassScreen manifest={manifest} musicUrl={blobUrl(session.audioUrl)} vibe={session.vibe} />;
}
