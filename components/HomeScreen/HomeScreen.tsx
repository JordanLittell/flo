"use client";

import { useState } from "react";
import FlowCard from "../FlowCard/FlowCard";
import GenerateScreen from "../GenerateScreen/GenerateScreen";
import PromptField from "../PromptField/PromptField";
import Select from "../Select/Select";
import TimeFilter from "../TimeFilter/TimeFilter";
import VibeSelect from "../VibeSelect/VibeSelect";
import type { Vibe } from "../vibes";
import { DEFAULT_MINUTES, type SessionRequest } from "@/lib/generation/request";
import { INSTRUCTORS, LEVELS, type Level } from "@/lib/instructors";
import { COMMUNITY_FLOWS, POPULAR_FLOWS, lengthBucket } from "@/lib/mock-flows";
import styles from "./HomeScreen.module.css";

const LEVEL_OPTIONS = LEVELS.map((level) => ({ value: level, label: level }));
const INSTRUCTOR_OPTIONS = INSTRUCTORS.map((instructor) => ({
  value: instructor.voiceId,
  label: `${instructor.name} · ${instructor.description}`,
}));

export default function HomeScreen() {
  const [length, setLength] = useState("any");
  const [vibe, setVibe] = useState<Vibe>("tide");
  const [level, setLevel] = useState<Level>("All levels");
  const [voiceId, setVoiceId] = useState(INSTRUCTORS[0].voiceId);
  const [request, setRequest] = useState<SessionRequest | null>(null);
  const matches = (minutes: number) => length === "any" || lengthBucket(minutes) === length;

  const popular = POPULAR_FLOWS.filter((flow) => matches(flow.minutes));
  const community = COMMUNITY_FLOWS.filter((flow) => matches(flow.minutes));

  if (request) return <GenerateScreen request={request} onBack={() => setRequest(null)} />;

  return (
    <main className={styles.page}>
      <h1 className={styles.wordmark}>Flo</h1>

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
            setRequest({ prompt, minutes: length === "any" ? DEFAULT_MINUTES : Number(length), vibe, level, voiceId })
          }
        />
      </div>

      <section className={styles.section} aria-labelledby="popular-heading">
        <h2 id="popular-heading" className={styles.heading}>
          Popular flows
        </h2>
        {popular.length ? (
          <div className={styles.grid}>
            {popular.map((flow) => (
              <FlowCard
                key={flow.id}
                title={flow.title}
                minutes={flow.minutes}
                level={flow.level}
                poses={flow.poses}
                vibe={flow.vibe}
                tag={flow.tag}
                onClick={() => console.log("popular flow selected", flow.id)}
              />
            ))}
          </div>
        ) : (
          <p className={styles.empty}>No flows that length yet.</p>
        )}
      </section>

      <section className={styles.section} aria-labelledby="community-heading">
        <h2 id="community-heading" className={styles.heading}>
          Community flows
        </h2>
        {community.length ? (
          <div className={styles.grid}>
            {community.map((flow) => (
              <FlowCard
                key={flow.id}
                title={flow.title}
                minutes={flow.minutes}
                level={flow.level}
                poses={flow.poses}
                vibe={flow.vibe}
                onClick={() => console.log("community flow selected", flow.id)}
              />
            ))}
          </div>
        ) : (
          <p className={styles.empty}>No flows that length yet.</p>
        )}
      </section>
    </main>
  );
}
