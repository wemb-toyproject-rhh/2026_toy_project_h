import styles from "./VersionSelectBar.module.css";

/**
 * 버전 A 는 항상 hist_id 가 작은 쪽, 버전 B 는 큰 쪽입니다.
 * 목록에서 넘어올 때 이미 정렬해서 오고, 여기서 바꿔도 같은 규칙이 유지됩니다.
 */
export default function VersionSelectBar({
  versions = [],
  valueA,
  valueB,
  onChangeA,
  onChangeB,
  targetLabel = "-",
}) {
  const option = (item) => (
    <option key={item.histId} value={item.histId}>
      id : {item.histId} · {item.savedAt}
    </option>
  );

  return (
    <div className={styles.bar}>
      <div className={styles.field}>
        <label className={styles.label}>버전 A (이전)</label>
        <select
          className={styles.select}
          value={valueA ?? ""}
          onChange={(e) => onChangeA?.(Number(e.target.value))}
        >
          {versions.map(option)}
        </select>
      </div>

      <span className={styles.vs}>VS</span>

      <div className={styles.field}>
        <label className={styles.label}>버전 B (이후)</label>
        <select
          className={styles.select}
          value={valueB ?? ""}
          onChange={(e) => onChangeB?.(Number(e.target.value))}
        >
          {versions.map(option)}
        </select>
      </div>

      <div className={`${styles.field} ${styles.targetField}`}>
        <label className={styles.label}>타겟</label>
        <div className={styles.targetName} title={targetLabel}>
          {targetLabel}
        </div>
      </div>
    </div>
  );
}
