import styles from "./VersionSelectBar.module.css";

export default function VersionSelectBar() {
  return (
    <div className={styles.bar}>
      <div className={styles.field}>
        <label className={styles.label}>버전 A</label>
        <select className={styles.select} defaultValue="10">
          <option value="10">PR #10 · 2026-08-30 15:00</option>
        </select>
      </div>

      <span className={styles.vs}>VS</span>

      <div className={styles.field}>
        <label className={styles.label}>버전 B</label>
        <select className={styles.select} defaultValue="12">
          <option value="12">PR #12 · 2026-08-31 10:20</option>
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
