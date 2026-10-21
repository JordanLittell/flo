import Arches from "../Arches/Arches";
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
