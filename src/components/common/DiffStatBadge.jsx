import styles from "./DiffStatBadge.module.css";

export default function DiffStatBadge({ additions = 0, deletions = 0 }) {
  const total = additions + deletions;
  if (total === 0) return null;

  return (
    <span className={styles.badge} title={`+${additions} -${deletions}`}>
      <span className={styles.add}>+{additions}</span>
      <span className={styles.del}>-{deletions}</span>
    </span>
  );
}
