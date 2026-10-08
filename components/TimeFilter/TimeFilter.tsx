"use client";

import { useState } from "react";
import styles from "./TimeFilter.module.css";

export interface TimeOption {
  value: string;
  label: string;
}

export const TIME_OPTIONS: TimeOption[] = [
  { value: "any", label: "Any length" },
  { value: "10", label: "10 min" },
  { value: "20", label: "20 min" },
  { value: "30", label: "30 min" },
  { value: "45", label: "45+ min" },
];

export interface TimeFilterProps {
  options?: TimeOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  label?: string;
  className?: string;
}

/** Single-choice class length. The selected option is the home screen's only saffron. */
export default function TimeFilter({
  options = TIME_OPTIONS,
  value,
  defaultValue,
  onChange,
  label = "Class length",
  className,
}: TimeFilterProps) {
  const [local, setLocal] = useState(defaultValue ?? options[0].value);
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
