"use client";

import { useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { classStateAt, holdsFrom } from "@/lib/audio/timeline";
import { useSessionAudio } from "@/lib/audio/useSessionAudio";
import type { SessionManifest } from "@/lib/generation/storage";
import Button from "../Button/Button";
import SessionPlayer from "../SessionPlayer/SessionPlayer";
import type { Vibe } from "../vibes";
import styles from "./ClassScreen.module.css";

export interface ClassScreenProps {
  manifest: SessionManifest;
  /** Overrides for testing a voice track against a separately generated loop. */
  musicUrl?: string;
  vibe?: Vibe;
}

export default function ClassScreen({ manifest, musicUrl, vibe }: ClassScreenProps) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const field = vibe ?? manifest.vibe ?? "tide";
  const audio = useSessionAudio({ voiceUrl: manifest.audioUrl, musicUrl: musicUrl ?? manifest.musicUrl });
  const { transcript, timeline, duration } = manifest;

  const holds = useMemo(() => holdsFrom(timeline, duration), [timeline, duration]);
  const state = classStateAt(timeline, holds, audio.elapsed);
  const firstPose = holds.find((hold) => hold.pose)?.start ?? 0;
  const meta = `${Math.round(duration / 60)} min · ${transcript.level}`;

  function askToExit() {
    audio.pause();
    dialog.current?.showModal();
  }

  function endClass() {
    audio.stop();
    router.push("/");
  }

  if (audio.status === "idle" || audio.status === "loading" || audio.status === "error") {
    return (
      <main className={styles.field} data-vibe={field}>
        <div className={styles.center}>
          <h1 className={styles.title}>{transcript.title}</h1>
          <p className={styles.meta}>{meta}</p>
          {audio.status === "error" ? (
            <p className={styles.meta} role="alert">
              {audio.error ?? "Couldn't load the audio."} {audio.elapsed > 0 ? "Try again to pick up where you left off." : ""}
            </p>
          ) : null}
          <Button variant="on-vibe" size="lg" icon="play" onClick={audio.start} disabled={audio.status === "loading"}>
            {audio.status === "error" ? "Try again" : audio.status === "loading" ? "Starting…" : "Start class"}
          </Button>
        </div>
      </main>
    );
  }

  if (audio.status === "ended") {
    return (
      <main className={styles.field} data-vibe={field}>
        <div className={styles.center}>
          <h1 className={styles.title}>Nice work.</h1>
          <p className={styles.meta}>{Math.round(duration / 60)} minutes on the mat.</p>
          <Button variant="on-vibe" size="lg" onClick={() => router.push("/")}>
            Done
          </Button>
        </div>
      </main>
    );
  }

  return (
    <>
      <SessionPlayer
        vibe={field}
        elapsed={audio.elapsed}
        total={duration}
        holdRemaining={state.holdRemaining}
        holdTotal={state.holdTotal}
        pose={state.pose ?? (audio.elapsed < firstPose ? "Settle in" : "Closing")}
        cue={state.cue}
        next={state.next}
        paused={audio.status === "paused"}
        buffering={audio.buffering}
        onPause={audio.pause}
        onResume={audio.resume}
        onExit={askToExit}
      />
      <dialog ref={dialog} className={styles.dialog} aria-labelledby="exit-title">
        <h2 id="exit-title" className={styles.dialogTitle}>
          End class?
        </h2>
        <p className={styles.dialogBody}>Your progress in this class won&apos;t be saved.</p>
        <div className={styles.dialogActions}>
          <Button
            onClick={() => {
              dialog.current?.close();
              void audio.resume();
            }}
          >
            Keep going
          </Button>
          <Button className={styles.end} onClick={endClass}>
            End class
          </Button>
        </div>
      </dialog>
    </>
  );
}
