import { useNavigate } from "react-router-dom";
import Badge from "../common/Badge.jsx";
import Button from "../common/Button.jsx";
import styles from "./PRCard.module.css";

export default function PRCard({
  item,
  selected = false,
  selectionDisabled = false,
  onToggleSelect,
}) {
  const navigate = useNavigate();

  return (
    <div
      className={`${styles.card} ${selected ? styles.highlighted : ""}`}
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/history/${item.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter") navigate(`/history/${item.id}`);
      }}
    >
      <input
        type="checkbox"
        className={styles.checkbox}
        aria-label="비교 대상으로 선택"
        checked={selected}
        disabled={!selected && selectionDisabled}
        onClick={(e) => e.stopPropagation()}
        onChange={() => onToggleSelect(item.id)}
      />

      <div className={styles.body}>
        <div className={styles.topRow}>
          <div className={styles.titleGroup}>
            <Badge tone={selected ? "accent" : "neutral"}>PR #{item.id}</Badge>
            <span className={styles.title}>{item.title}</span>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={(e) => e.stopPropagation()}
          >
            삭제
          </Button>
        </div>

        <div className={styles.meta}>
          작성자 {item.author} · 저장 {item.savedAt}
        </div>

        {item.changes?.length > 0 && (
          <div className={styles.changes}>
            {item.changes.map((change, idx) => (
              <div key={idx} className={styles.changeRow}>
                <span className={styles.dot} />
                <strong>{change.target}</strong>
                <span className={styles.changePath}>{change.path}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
