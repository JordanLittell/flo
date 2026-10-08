import styles from "./Icon.module.css";

export type IconName = "search" | "arrow" | "play" | "pause" | "close" | "clock";

const PATHS: Record<IconName, React.ReactNode> = {
  search: (
    <>
      <circle cx={11} cy={11} r={6.5} />
      <path d="M20 20l-4.2-4.2" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  play: <path d="M8 5.5v13l10.5-6.5z" />,
  pause: <path d="M9 5.5v13M15 5.5v13" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  clock: (
    <>
      <circle cx={12} cy={12} r={8} />
      <path d="M12 8v4.5l3 1.5" />
    </>
  ),
};

export default function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      {PATHS[name]}
    </svg>
  );
}
