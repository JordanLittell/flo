"use client";

import { useCallback, useEffect, useRef } from "react";
import { completeSession, startSession } from "@/lib/sessions/actions";
import type { AudioStatus } from "./useSessionAudio";

/** Seconds of playback between progress saves. */
const SAVE_EVERY = 15;

/**
 * Keeps the user's history in step with playback: records fresh starts and completion, and saves the
 * position while playing, on pause or failure, and as the page closes so the class can be resumed.
 */
export function useSessionProgress({
  sessionId,
  status,
  elapsed,
  startAt = 0,
}: {
  sessionId: string;
  status: AudioStatus;
  elapsed: number;
  startAt?: number;
}) {
  const position = useRef(startAt);
  const saved = useRef(startAt);
  const active = status === "playing" || status === "paused" || status === "error";

  useEffect(() => {
    position.current = elapsed;
  }, [elapsed]);

  const save = useCallback(
    ({ beacon = false } = {}) => {
      const at = position.current;
      if (Math.abs(at - saved.current) < 1) return;
      saved.current = at;
      const url = `/api/sessions/${sessionId}/progress`;
      const body = JSON.stringify({ position: at });
      if (beacon && navigator.sendBeacon?.(url, body)) return;
      void fetch(url, { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(
        (error: unknown) => console.warn("[progress] could not save", error),
      );
    },
    [sessionId],
  );

  /** Call when the class starts from the beginning (first play, replay or start over). */
  const restart = useCallback(() => {
    position.current = 0;
    saved.current = 0;
    void startSession(sessionId).catch((error: unknown) => console.warn("[progress] could not record start", error));
  }, [sessionId]);

  useEffect(() => {
    if (status === "playing" && elapsed - saved.current >= SAVE_EVERY) save();
  }, [status, elapsed, save]);

  useEffect(() => {
    if (status === "paused" || status === "error") save();
    if (status === "ended") {
      void completeSession(sessionId).catch((error: unknown) => console.warn("[progress] could not record completion", error));
    }
  }, [status, save, sessionId]);

  useEffect(() => {
    if (!active) return;
    const onHide = () => {
      if (document.visibilityState === "hidden") save({ beacon: true });
    };
    const onPageHide = () => save({ beacon: true });
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [active, save]);

  return { save, restart };
}
