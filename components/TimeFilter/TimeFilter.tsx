"use client";

import { useState } from "react";
import styles from "./TimeFilter.module.css";

export interface TimeOption {
  value: string;
  default?: boolean;
  label: string;
}

export const TIME_OPTIONS: TimeOption[] = [
  { value: "5", label: "5 min", default: true },
  { value: "10", label: "10 min" },
  { value: "20", label: "20 min" },
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
  { value: "60", label: "60 min" },
];

export interface TimeFilterProps {
  options?: TimeOption[];
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  className?: string;
}

/** Single-choice class length. The selected option is the home screen's only saffron. */
export default function TimeFilter({
  options = TIME_OPTIONS,
  value,
  onChange,
  label = "Class length",
  className,
}: TimeFilterProps) {
  const defaultValue = options[0].value;
  const [local, setLocal] = useState(defaultValue);
  const current = value ?? local;

  return (
    <div
      className={[styles.time, className].filter(Boolean).join(" ")}
      role="radiogroup"
      aria-label={label}
    >
      {options.map((option) => {
        const on = option.value === current;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={on}
            className={on ? `${styles.option} ${styles.on}` : styles.option}
            onClick={() => {
              setLocal(option.value);
              onChange?.(option.value);
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
