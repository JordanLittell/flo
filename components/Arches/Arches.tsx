import styles from "./Arches.module.css";

/** Rising half-rounds: the breath / sunrise motif shared by flow art and the loader. Fills its parent. */
export default function Arches() {
  return (
    <svg className={styles.arches} viewBox="0 0 200 120" preserveAspectRatio="xMidYMax slice" aria-hidden>
      <circle cx={150} cy={132} r={74} className={styles.a1} />
      <circle cx={150} cy={132} r={50} className={styles.a2} />
      <circle cx={150} cy={132} r={26} className={styles.a3} />
      <circle cx={44} cy={34} r={9} className={styles.a3} />
    </svg>
  );
}
