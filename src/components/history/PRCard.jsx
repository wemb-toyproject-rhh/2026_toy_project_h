import { Link } from "react-router-dom";
import Badge from "../common/Badge.jsx";
import Button from "../common/Button.jsx";
import styles from "./PRCard.module.css";

export default function PRCard({ item, highlighted = false }) {
  return (
    <div className={`${styles.card} ${highlighted ? styles.highlighted : ""}`}>
      <input type="checkbox" className={styles.checkbox} aria-label="비교 대상으로 선택" />

      <div className={styles.body}>
        <div className={styles.topRow}>
          <div className={styles.titleGroup}>
            <Badge tone={highlighted ? "accent" : "neutral"}>PR #{item.id}</Badge>
            <Link to={`/history/${item.id}`} className={styles.title}>
              {item.title}
            </Link>
          </div>
          <Button variant="danger" size="sm">
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
