import Arches from "../Arches/Arches";
import Button from "../Button/Button";
import { formatClock } from "../SessionPlayer/SessionPlayer";
import { VIBES, type Vibe } from "../vibes";
import styles from "./SessionItem.module.css";

export interface SessionItemProps {
  title: string;
  minutes: number;
  level: string;
  vibe: Vibe;
  completed: boolean;
  /** Seconds into the class where the user stopped; used while not completed. */
  position: number;
  /** Length of the class in seconds. */
  duration: number;
  completedAt?: Date | null;
  /** Replay when completed, resume otherwise. */
  onPlay?: () => void;
}

const DATE = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });

/** One row in the user's session history: a completed class to replay, or one in progress to resume. */
export default function SessionItem({
  title,
  minutes,
  level,
  vibe,
  completed,
  position,
  duration,
  completedAt,
  onPlay,
}: SessionItemProps) {
  const meta = [`${minutes} min`, level, VIBES[vibe]].join(" · ");
  const at = Math.min(position, duration);
  const progressText = `${formatClock(at)} of ${formatClock(duration)}`;
  const action = completed ? "Replay" : "Resume";

  return (
    <article className={styles.item} aria-label={`${title}, ${completed ? "completed" : "in progress"}`}>
      <span className={styles.art} data-vibe={vibe}>
        <Arches />
      </span>
      <div className={styles.body}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.meta}>{meta}</p>
        {completed ? (
          <p className={styles.status}>
            <span className={styles.tag}>Completed</span>
            {completedAt ? (
              // The server and browser can format the date in different time zones.
              <time dateTime={completedAt.toISOString()} suppressHydrationWarning>
                {DATE.format(completedAt)}
              </time>
            ) : null}
          </p>
        ) : (
          <div className={styles.status}>
            <span
              className={styles.bar}
              role="progressbar"
              aria-label="Progress"
              aria-valuemin={0}
              aria-valuemax={Math.round(duration)}
              aria-valuenow={Math.round(at)}
              aria-valuetext={progressText}
            >
              <span style={{ width: `${duration ? (at / duration) * 100 : 0}%` }} />
            </span>
            <span>In progress · {progressText}</span>
          </div>
        )}
      </div>
      <Button className={styles.action} icon="play" onClick={onPlay} aria-label={`${action} ${title}`}>
        {action}
      </Button>
    </article>
  );
}
