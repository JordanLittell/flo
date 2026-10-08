import type { Vibe } from "../vibes";
import styles from "./PrepareLoader.module.css";

export type LoaderStepStatus = "pending" | "active" | "done";

export interface LoaderStep {
  id: string;
  /** Sentence case, no ellipsis. */
  label: string;
  status: LoaderStepStatus;
}

export const LOADER_STEPS = [
  { id: "script", label: "Designing your flow" },
  { id: "voice", label: "Recording your instructor" },
  { id: "music", label: "Composing your music" },
  { id: "finish", label: "Getting everything ready" },
] as const;

export type LoaderStepId = (typeof LOADER_STEPS)[number]["id"];

const STATE_LABEL: Record<LoaderStepStatus, string> = { pending: "Waiting", active: "In progress", done: "Done" };

export interface PrepareLoaderProps {
  /** 0–100, driven only by real generation events. */
  progress: number;
  steps: LoaderStep[];
  vibe: Vibe;
  title?: string;
  /** Shown instead of the status line, e.g. a failure message. */
  message?: string;
  children?: React.ReactNode;
}

function Ring({ value }: { value: number }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <svg className={styles.ring} viewBox="0 0 100 100" aria-hidden>
      <circle cx={50} cy={50} r={r} className={styles.track} />
      <circle cx={50} cy={50} r={r} className={styles.fill} strokeDasharray={c} strokeDashoffset={c * (1 - value)} />
    </svg>
  );
}

/** Full-viewport preparation screen on the vibe field; the field continues into the class without a cut. */
export default function PrepareLoader({ progress, steps, vibe, title, message, children }: PrepareLoaderProps) {
  const pct = Math.round(Math.max(0, Math.min(100, progress)));
  // Sentence case across joined labels: "Recording your instructor and composing your music…"
  const active = steps
    .filter((step) => step.status === "active")
    .map((step, index) => (index === 0 ? step.label : step.label.charAt(0).toLowerCase() + step.label.slice(1)));
  const status = message ?? (active.length ? `${active.join(" and ")}…` : steps.every((step) => step.status === "done") ? "Ready" : "");

  return (
    <div
      className={styles.loader}
      data-vibe={vibe}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-valuetext={`${pct}%, ${status}`}
    >
      <div className={styles.ringBox}>
        <Ring value={pct / 100} />
        <span className={styles.pct}>
          {pct}
          <small>%</small>
        </span>
      </div>
      <p className={styles.message} key={status}>
        {status}
      </p>
      <ol className={styles.steps}>
        {steps.map((step) => (
          <li key={step.id} className={styles[step.status]}>
            <span className={styles.dot} aria-hidden />
            {step.label}
            <span className="sr-only">, {STATE_LABEL[step.status]}</span>
          </li>
        ))}
      </ol>
      {title ? <p className={styles.title}>{title}</p> : null}
      {children}
    </div>
  );
}
