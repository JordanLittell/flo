"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { GenerationEvent, SessionRequest } from "@/lib/generation/request";
import { INSTRUCTORS } from "@/lib/instructors";
import Button from "../Button/Button";
import PrepareLoader, { LOADER_STEPS, type LoaderStepId, type LoaderStepStatus } from "../PrepareLoader/PrepareLoader";

type Statuses = Record<LoaderStepId, LoaderStepStatus>;

const INITIAL: Statuses = { script: "active", voice: "pending", music: "pending", finish: "pending" };

/**
 * Overall progress from real events: the script is the first 50%, voicing the next 45% (music runs
 * alongside it), and storing the files the last 5%.
 */
function overall(statuses: Statuses, scriptFraction: number, voiceFraction: number): number {
  if (statuses.finish === "done") return 100;
  if (statuses.finish === "active") return 90;
  const script = statuses.script === "done" ? 1 : scriptFraction;
  const voice = statuses.voice === "done" ? 1 : voiceFraction;
  return script * 35 + voice * 50;
}

export interface GenerateScreenProps {
  request: SessionRequest;
  onBack: () => void;
}

/** Runs a generation on the server, shows its real steps, then opens the class. */
export default function GenerateScreen({ request, onBack }: GenerateScreenProps) {
  const router = useRouter();
  const [statuses, setStatuses] = useState<Statuses>(INITIAL);
  const [scriptFraction, setScriptFraction] = useState(0);
  const [voiceFraction, setVoiceFraction] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // Each request costs real API credit, so it must start exactly once, even when React runs effects
  // twice in development. The request also isn't aborted on unmount: the server finishes and stores it.
  const startedFor = useRef<SessionRequest | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (startedFor.current === request) return;
    startedFor.current = request;

    async function run() {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      if (!response.ok || !response.body) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `Generation failed (${response.status}).`);
      }

      // Newline-delimited JSON: one event per line.
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      let finished = false;
      let errorMessage = "";
      let lastevent: GenerationEvent | null = null;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines.filter(Boolean)) {
          const event = JSON.parse(line) as GenerationEvent;
          lastevent = event;
          switch (event.type) {
            case "step":
              setStatuses((current) => ({ ...current, [event.step]: event.status }));
              if (event.step === "script") setScriptFraction(event.progress);
              if (event.step === "voice" && event.total) setVoiceFraction((event.done ?? 0) / event.total);
              break;
            case "error":
              errorMessage = event.message;
              setError(event.message);
              finished = true;
              break;
            case "done":
              finished = true;
              if (mounted.current) router.push(`/class/${event.sessionId}`);
              break;
          }
        }
      }
      if (!finished) {
        setError(errorMessage || "The connection closed before your class was ready. Please try again.");
        console.error("[generate] error:", errorMessage, lastevent);
        return;
      }
    }

    run().catch((cause: unknown) => {
      console.error("[generate]", cause);
      setError(cause instanceof Error ? cause.message : "Generation failed.");
    });
  }, [request, router]);

  const instructor = INSTRUCTORS.find((item) => item.voiceId === request.voiceId)?.name;
  const steps = LOADER_STEPS.map((step) => ({ ...step, status: statuses[step.id] }));

  return (
    <PrepareLoader
      progress={overall(statuses, scriptFraction, voiceFraction)}
      steps={steps}
      vibe={request.vibe}
      title={[instructor, `${request.minutes} min`, request.level].filter(Boolean).join(" · ")}
      message={error ? `Something went wrong: ${error}` : undefined}
    >
      {error ? (
        <Button variant="on-vibe" size="lg" onClick={onBack}>
          Back
        </Button>
      ) : null}
    </PrepareLoader>
  );
}
