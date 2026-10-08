import { VIBES, type Vibe } from "../vibes";
import styles from "./FlowCard.module.css";

export interface FlowCardProps {
  title: string;
  minutes?: number;
  level?: string;
  poses?: number;
  vibe?: Vibe;
  /** One word, e.g. "Popular". */
  tag?: string;
  onClick?: () => void;
  className?: string;
}

/** Rising half-rounds: the breath / sunrise motif shared by flow art and the loader. */
function Arches() {
  return (
    <svg className={styles.arches} viewBox="0 0 200 120" preserveAspectRatio="xMidYMax slice" aria-hidden>
      <circle cx={150} cy={132} r={74} className={styles.a1} />
      <circle cx={150} cy={132} r={50} className={styles.a2} />
      <circle cx={150} cy={132} r={26} className={styles.a3} />
      <circle cx={44} cy={34} r={9} className={styles.a3} />
    </svg>
  );
}

/** A flow in Popular flows or Community flows; the whole card is a button. */
export default function FlowCard({
  title,
  minutes,
  level,
  poses,
  vibe = "tide",
  tag,
  onClick,
  className,
}: FlowCardProps) {
  const meta = [
    minutes != null ? `${minutes} min` : null,
    level,
    poses != null ? `${poses} poses` : null,
    VIBES[vibe],
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <button type="button" className={[styles.card, className].filter(Boolean).join(" ")} onClick={onClick}>
      <span className={styles.art} data-vibe={vibe}>
        <Arches />
        {tag ? <span className={styles.tag}>{tag}</span> : null}
      </span>
      <span className={styles.body}>
        <span className={styles.title}>{title}</span>
        <span className={styles.meta}>{meta}</span>
      </span>
    </button>
  );
}
