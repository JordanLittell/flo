"use client";

import { useState } from "react";
import FlowCard from "../FlowCard/FlowCard";
import PromptField from "../PromptField/PromptField";
import TimeFilter from "../TimeFilter/TimeFilter";
import { COMMUNITY_FLOWS, POPULAR_FLOWS, lengthBucket } from "@/lib/mock-flows";
import styles from "./HomeScreen.module.css";

export default function HomeScreen() {
  const [length, setLength] = useState("any");
  const matches = (minutes: number) => length === "any" || lengthBucket(minutes) === length;

  const popular = POPULAR_FLOWS.filter((flow) => matches(flow.minutes));
  const community = COMMUNITY_FLOWS.filter((flow) => matches(flow.minutes));

  return (
    <main className={styles.page}>
      <h1 className={styles.wordmark}>Flo</h1>

      <div className={styles.controls}>
      <TimeFilter value={length} onChange={setLength} />
        <PromptField onSubmit={(prompt) => console.log("prompt submitted", { prompt, length })} />
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
