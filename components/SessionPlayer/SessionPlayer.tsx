import Icon from "../Icon/Icon";
import type { Vibe } from "../vibes";
import styles from "./SessionPlayer.module.css";

export interface SessionPlayerProps {
  vibe: Vibe;
  /** All times in seconds. */
  elapsed: number;
  total: number;
  holdRemaining: number;
  holdTotal: number;
  pose: string;
  cue?: string | null;
  next?: string | null;
  paused?: boolean;
  /** The voice is waiting on the network. */
  buffering?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onExit?: () => void;
}

export function formatClock(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds || 0));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

function Ring({ value }: { value: number }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const f = Math.max(0, Math.min(1, value));
  return (
    <svg className={styles.ring} viewBox="0 0 100 100" aria-hidden>
      <circle cx={50} cy={50} r={r} className={styles.ringTrack} />
      <circle cx={50} cy={50} r={r} className={styles.ringFill} strokeDasharray={c} strokeDashoffset={c * (1 - f)} />
    </svg>
  );
}

/** Full-screen class view on the vibe field. Read from the mat: pose 30px+, hold count 64px. */
export default function SessionPlayer({
  vibe,
  elapsed,
  total,
  holdRemaining,
  holdTotal,
  pose,
  cue,
  next,
  paused,
  buffering,
  onPause,
  onResume,
  onExit,
}: SessionPlayerProps) {
  const progress = total ? elapsed / total : 0;
  const hold = holdTotal ? holdRemaining / holdTotal : 0;

  return (
    <section
      className={paused ? `${styles.session} ${styles.paused}` : styles.session}
      data-vibe={vibe}
      aria-label="Class in progress"
    >
      <header className={styles.top}>
        <span className={styles.clock}>
          {formatClock(elapsed)}
          <span> / {formatClock(total)}</span>
        </span>
        <span className={styles.bar} aria-hidden>
          <span style={{ width: `${progress * 100}%` }} />
        </span>
        <button type="button" className={styles.exit} onClick={onExit} aria-label="End class">
          <Icon name="close" />
        </button>
      </header>

      <div className={styles.main}>
        <div className={styles.breath}>
          <Ring value={hold} />
          <span className={styles.core}>
            <span className={styles.overline}>{paused ? "Paused" : buffering ? "Loading" : "Hold"}</span>
            <span className={styles.count}>{Math.ceil(holdRemaining || 0)}</span>
          </span>
        </div>
        <div className={styles.copy} aria-live="polite">
          <h2 className={styles.pose}>{pose}</h2>
          {cue ? <p className={styles.cue}>{cue}</p> : null}
        </div>
      </div>

      <footer className={styles.foot}>
        {next ? (
          <span className={styles.next}>
            <span className={styles.overline}>Next pose</span>
            {next}
          </span>
        ) : (
          <span />
        )}
        <button type="button" className={styles.toggle} onClick={paused ? onResume : onPause}>
          <Icon name={paused ? "play" : "pause"} />
          {paused ? "Resume" : "Pause"}
        </button>
      </footer>
    </section>
  );
}
