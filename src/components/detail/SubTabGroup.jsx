import { useState } from "react";
import styles from "./SubTabGroup.module.css";

/**
 * activePrimary / activeSub 를 넘기면 바깥에서 제어하고,
 * 넘기지 않으면 컴포넌트가 스스로 상태를 들고 동작합니다(기존 화면 호환).
 */
export default function SubTabGroup({
  targetLabel,
  primaryTabs = [],
  lifecycles = [],
  activePrimary,
  onPrimaryChange,
  activeSub,
  onSubChange,
  legend = "이번 이력에서 변경된 스크립트",
}) {
  const [innerPrimary, setInnerPrimary] = useState(
    primaryTabs.find((t) => t.modified)?.id ?? primaryTabs[0]?.id,
  );
  const [innerSub, setInnerSub] = useState(
    lifecycles.find((l) => l.modified)?.id ?? lifecycles[0]?.id,
  );

  const primaryId = activePrimary ?? innerPrimary;
  const subId = activeSub ?? innerSub;

  const selectPrimary = (id) =>
    onPrimaryChange ? onPrimaryChange(id) : setInnerPrimary(id);
  const selectSub = (id) => (onSubChange ? onSubChange(id) : setInnerSub(id));

  return (
    <div className={styles.group}>
      <div className={styles.header}>
        <span className={styles.targetLabel}>
          {targetLabel ? `선택된 대상 · ${targetLabel}` : "라이프사이클"}
        </span>
        <span className={styles.legend}>
          <span className={styles.dot} /> {legend}
        </span>
      </div>

      {primaryTabs.length > 0 && (
        <div className={styles.primaryTabs}>
          {primaryTabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.primaryTab} ${primaryId === tab.id ? styles.active : ""}`}
              onClick={() => selectPrimary(tab.id)}
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
            className={`${styles.subTab} ${subId === tab.id ? styles.active : ""}`}
            onClick={() => selectSub(tab.id)}
          >
            {tab.label}
            {tab.modified && <span className={styles.dot} />}
          </button>
        ))}
      </div>
    </div>
  );
}
