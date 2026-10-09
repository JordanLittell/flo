"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "../Button/Button";
import FlowCard from "../FlowCard/FlowCard";
import GenerateScreen from "../GenerateScreen/GenerateScreen";
import PromptField from "../PromptField/PromptField";
import Select from "../Select/Select";
import TimeFilter, { TIME_OPTIONS } from "../TimeFilter/TimeFilter";
import VibeSelect from "../VibeSelect/VibeSelect";
import type { Vibe } from "../vibes";
import { DEFAULT_MINUTES, type SessionRequest } from "@/lib/generation/request";
import { INSTRUCTORS, LEVELS, type Level } from "@/lib/instructors";
import type { SessionData } from "@/lib/data";
import styles from "./HomeScreen.module.css";

const LEVEL_OPTIONS = LEVELS.map((level) => ({ value: level, label: level }));
const INSTRUCTOR_OPTIONS = INSTRUCTORS.map((instructor) => ({
  value: instructor.voiceId,
  label: `${instructor.name} · ${instructor.description}`,
}));

export default function HomeScreen({ sessions }: { sessions: SessionData[] }) {
  const router = useRouter();
  const [length, setLength] = useState(TIME_OPTIONS[0].value);
  const [vibe, setVibe] = useState<Vibe>("tide");
  const [level, setLevel] = useState<Level>("All levels");
  const [voiceId, setVoiceId] = useState(INSTRUCTORS[0].voiceId);
  const [request, setRequest] = useState<SessionRequest | null>(null);

  if (request) return <GenerateScreen request={request} onBack={() => setRequest(null)} />;

  return (
    <main className={styles.page}>
      <h1 className={styles.wordmark}>Flo</h1>
      <Button className={styles.signOut} onClick={() => signOut({ callbackUrl: "/sign-in" })}>
        Sign out
      </Button>

      <div className={styles.controls}>
        <TimeFilter value={length} onChange={setLength} />
        <VibeSelect value={vibe} onChange={setVibe} />
        <div className={styles.selects}>
          <Select label="Level" value={level} options={LEVEL_OPTIONS} onChange={(value) => setLevel(value as Level)} />
          <Select label="Instructor" value={voiceId} options={INSTRUCTOR_OPTIONS} onChange={setVoiceId} />
        </div>
        <PromptField
          onSubmit={(prompt) =>
            // "Any length" uses the default; the prompt's own length still wins during generation.
            setRequest({ prompt, minutes: Number(length), vibe, level, voiceId })
          }
        />
      </div>

      <section className={styles.section} aria-labelledby="popular-heading">
        <h2 id="popular-heading" className={styles.heading}>
          Community flows
        </h2>
        {sessions.length ? (
          <div className={styles.grid}>
            {sessions.map((session) => (
              <FlowCard
                key={session.id}
                title={session.title}
                minutes={session.minutes}
                level={session.level}
                vibe={session.vibe}
                onClick={() => router.push(`/class/${session.id}`)}
              />
            ))}
          </div>
        ) : (
          <p className={styles.empty}>No flows yet. Generate one above.</p>
        )}
      </section>
    </main>
  );
}
