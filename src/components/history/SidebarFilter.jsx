import mockHistory from "../../mocks/mockHistory.json";
import styles from "./SidebarFilter.module.css";

export default function SidebarFilter() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.heading}>타겟별 이력 모아보기</div>

      <div className={styles.list}>
        {mockHistory.targets.map((target, index) => (
          <div
            key={target.id}
            className={`${styles.item} ${index === 0 ? styles.active : ""}`}
          >
            <span className={styles.itemLabel}>
              <span className={styles.icon}>{target.icon}</span>
              {target.label}
            </span>
            <span className={styles.count}>{target.count}</span>
          </div>
        ))}
      </div>

      <p className={styles.hint}>
        특정 페이지를 선택하면 해당 타겟이 수정된 이력만 필터링되어 표시됩니다.
      </p>
    </aside>
  );
}
