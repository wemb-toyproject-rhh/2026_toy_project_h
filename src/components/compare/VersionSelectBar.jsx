import styles from "./VersionSelectBar.module.css";

export default function VersionSelectBar({ versionA, versionB }) {
  return (
    <div className={styles.bar}>
      <div className={styles.field}>
        <label className={styles.label}>버전 A</label>
        <select className={styles.select} defaultValue={versionA?.id}>
          <option value={versionA?.id}>
            {versionA?.targetLabel} · {versionA?.savedAt}
          </option>
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>버전 B</label>
        <select className={styles.select} defaultValue={versionB?.id}>
          <option value={versionB?.id}>
            {versionB?.targetLabel} · {versionB?.savedAt}
          </option>
        </select>
      </div>
    </div>
  );
}
