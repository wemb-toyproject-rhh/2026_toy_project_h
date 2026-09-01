import styles from "./VersionSelectBar.module.css";

export default function VersionSelectBar({ versionA, versionB }) {
  return (
    <div className={styles.bar}>
      <div className={styles.field}>
        <label className={styles.label}>버전 A</label>
        <select className={styles.select} defaultValue={versionA?.id}>
          <option value={versionA?.id}>
            PR #{versionA?.id} · {versionA?.savedAt}
          </option>
        </select>
      </div>

      <span className={styles.vs}>VS</span>

      <div className={styles.field}>
        <label className={styles.label}>버전 B</label>
        <select className={styles.select} defaultValue={versionB?.id}>
          <option value={versionB?.id}>
            PR #{versionB?.id} · {versionB?.savedAt}
          </option>
        </select>
      </div>

      <div className={`${styles.field} ${styles.targetField}`}>
        <label className={styles.label}>타겟 선택</label>
        <select className={styles.select} defaultValue="main">
          <option value="main">[Page] main</option>
        </select>
      </div>
    </div>
  );
}
