import styles from "./SubTabGroup.module.css";

export default function SubTabGroup({
  targetLabel,
  primaryTabs,
  lifecycles,
  activePrimaryId,
  activeSubId,
  onPrimaryChange,
  onSubChange,
}) {
  const activePrimaryTab = primaryTabs.find((tab) => tab.id === activePrimaryId);
  const showSubTabs = Boolean(activePrimaryTab?.hasSubTabs);

  return (
    <div className={styles.group}>
      <div className={styles.header}>
        <span className={styles.legend}>
          <span className={styles.dot} /> 이번 이력에서 변경된 스크립트
        </span>
      </div>

      <div className={styles.primaryTabs}>
        {primaryTabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.primaryTab} ${activePrimaryId === tab.id ? styles.active : ""}`}
            onClick={() => onPrimaryChange(tab.id)}
          >
            <span className={`${styles.fileIcon} ${styles[tab.id] ?? ""}`} />
            {tab.label}
            {tab.modified && <span className={styles.dot} />}
          </button>
        ))}
      </div>

      {showSubTabs && (
        <div className={styles.subTabs}>
          {lifecycles.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.subTab} ${activeSubId === tab.id ? styles.active : ""}`}
              onClick={() => onSubChange(tab.id)}
            >
              {tab.label}
              {tab.modified && <span className={styles.dot} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
