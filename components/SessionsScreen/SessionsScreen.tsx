"use client";

import { useRouter } from "next/navigation";
import Button from "../Button/Button";
import SessionItem from "../SessionItem/SessionItem";
import type { SessionData, UserSessionData } from "@/lib/data";
import styles from "./SessionsScreen.module.css";

export interface SessionHistoryEntry {
  session: SessionData;
  progress: UserSessionData;
}

/** The user's session history, most recently started first. */
export default function SessionsScreen({ entries }: { entries: SessionHistoryEntry[] }) {
  const router = useRouter();

  return (
    <main className={styles.page}>
      <h1 className={styles.wordmark}>Flo</h1>
      <nav className={styles.account} aria-label="Account">
        <Button onClick={() => router.push("/")}>Home</Button>
      </nav>

      <section className={styles.section} aria-labelledby="sessions-heading">
        <h2 id="sessions-heading" className={styles.heading}>
          Your sessions
        </h2>
        {entries.length ? (
          <ul className={styles.list}>
            {entries.map(({ session, progress }) => (
              <li key={session.id}>
                <SessionItem
                  title={session.title}
                  minutes={session.minutes}
                  level={session.level}
                  vibe={session.vibe}
                  completed={progress.status === "completed"}
                  position={progress.position}
                  duration={session.duration}
                  completedAt={progress.completedAt}
                  onPlay={() => router.push(`/class/${session.id}`)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>No sessions yet. Start a flow from home.</p>
        )}
      </section>
    </main>
  );
}
