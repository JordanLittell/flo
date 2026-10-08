"use client";

import { useRef } from "react";
import Icon from "../Icon/Icon";
import styles from "./PromptField.module.css";

export interface PromptFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onSubmit"> {
  /** Called with the trimmed prompt on Enter or Create; never with an empty string. */
  onSubmit?: (prompt: string) => void;
  /** Accessible label, visually hidden. */
  label?: string;
  submitLabel?: string;
}

/** Home-screen prompt box: the person describes a class and Claude generates it. Not a search. */
export default function PromptField({
  onSubmit,
  label = "Describe your class",
  submitLabel = "Create",
  className,
  disabled,
  ...rest
}: PromptFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = inputRef.current?.value.trim() ?? "";
    if (text) onSubmit?.(text);
  }

  return (
    <form className={[styles.prompt, className].filter(Boolean).join(" ")} onSubmit={handleSubmit}>
      <label className={styles.box}>
        <span className="sr-only">{label}</span>
        <input
          ref={inputRef}
          type="text"
          enterKeyHint="go"
          placeholder="Describe your class, like 20 min of hip openers"
          disabled={disabled}
          {...rest}
        />
      </label>
      <button type="submit" className={styles.go} disabled={disabled} aria-label={submitLabel}>
        <span className={styles.goLabel}>{submitLabel}</span>
        <Icon name="arrow" size={18} />
      </button>
    </form>
  );
}
