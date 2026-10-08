"use client";

import { VIBES, type Vibe } from "../vibes";
import styles from "./VibeSelect.module.css";

export interface VibeSelectProps {
  value: Vibe;
  onChange: (vibe: Vibe) => void;
  label?: string;
  className?: string;
}

/** Single-choice row of the design system's vibe pills. Each pill carries the vibe's name, never colour alone. */
export default function VibeSelect({ value, onChange, label = "Vibe", className }: VibeSelectProps) {
  return (
    <div className={[styles.row, className].filter(Boolean).join(" ")} role="radiogroup" aria-label={label}>
      {(Object.keys(VIBES) as Vibe[]).map((vibe) => {
        const on = vibe === value;
        return (
          <button
            key={vibe}
            type="button"
            role="radio"
            aria-checked={on}
            data-vibe={vibe}
            className={on ? `${styles.pill} ${styles.on}` : styles.pill}
            onClick={() => onChange(vibe)}
          >
            <span className={styles.dot} aria-hidden />
            {VIBES[vibe]}
          </button>
        );
      })}
    </div>
  );
}
