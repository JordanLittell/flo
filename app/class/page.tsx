import ClassScreen from "@/components/ClassScreen/ClassScreen";
import { VIBES, type Vibe } from "@/components/vibes";
import type { SessionManifest } from "@/lib/generation/storage";
import styles from "./page.module.css";

/** Only our public Blob store is fetched or played, so the page never loads arbitrary URLs. */
function blobUrl(value: string | string[] | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
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

export default async function ClassPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const sessionUrl = blobUrl(params.session);
  const manifest = sessionUrl ? await loadManifest(sessionUrl) : null;

  if (!manifest) {
    return (
      <main className={styles.missing}>
        <h1>Session not found</h1>
        <p>Open a class with ?session=&lt;session.json URL&gt;.</p>
      </main>
    );
  }

  const vibe = typeof params.vibe === "string" && Object.hasOwn(VIBES, params.vibe) ? (params.vibe as Vibe) : undefined;
  return <ClassScreen manifest={manifest} musicUrl={blobUrl(params.music)} vibe={vibe} />;
}
