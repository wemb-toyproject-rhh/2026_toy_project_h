import { useState } from "react";
import styles from "./SubTabGroup.module.css";

export default function SubTabGroup({
  targetLabel,
  primaryTabs = [],
  lifecycles,
}) {
  const [activePrimary, setActivePrimary] = useState(
    primaryTabs.find((t) => t.modified)?.id ?? primaryTabs[0]?.id,
  );
  const [activeSub, setActiveSub] = useState(
    lifecycles.find((l) => l.modified)?.id ?? lifecycles[0]?.id,
  );

  return (
    <div className={styles.group}>
      <div className={styles.header}>
        <span className={styles.targetLabel}>
          {targetLabel ? `선택된 대상 · ${targetLabel}` : "라이프사이클"}
        </span>
        <span className={styles.legend}>
          <span className={styles.dot} /> 이번 이력에서 변경된 스크립트
        </span>
      </div>

      {primaryTabs.length > 0 && (
        <div className={styles.primaryTabs}>
          {primaryTabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.primaryTab} ${activePrimary === tab.id ? styles.active : ""}`}
              onClick={() => setActivePrimary(tab.id)}
            >
              {tab.label}
              {tab.modified && <span className={styles.dot} />}
            </button>
          ))}
        </div>
      )}

      <div className={styles.subTabs}>
        {lifecycles.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.subTab} ${activeSub === tab.id ? styles.active : ""}`}
            onClick={() => setActiveSub(tab.id)}
          >
            {tab.label}
            {tab.modified && <span className={styles.dot} />}
          </button>
        ))}
      </div>
    </div>
  );
}
