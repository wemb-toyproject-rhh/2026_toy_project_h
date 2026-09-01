import { useNavigate } from "react-router-dom";
import Badge from "../common/Badge.jsx";
import Button from "../common/Button.jsx";
import Icon from "../common/Icon.jsx";
import styles from "./PRCard.module.css";

export default function PRCard({
  item,
  selected = false,
  selectionDisabled = false,
  onToggleSelect,
}) {
  const navigate = useNavigate();
  const toggleBlocked = !selected && selectionDisabled;

  const handleToggle = () => {
    if (toggleBlocked) return;
    onToggleSelect(item.id);
  };

  const goToDetail = (e) => {
    e.stopPropagation();
    navigate(`/history/${item.id}`);
  };

  return (
    <div
      className={`${styles.card} ${selected ? styles.highlighted : ""} ${toggleBlocked ? styles.disabled : ""}`}
      role="checkbox"
      aria-checked={selected}
      aria-disabled={toggleBlocked}
      tabIndex={0}
      onClick={handleToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleToggle();
        }
      }}
    >
      <input
        type="checkbox"
        className={styles.checkbox}
        aria-hidden="true"
        tabIndex={-1}
        checked={selected}
        disabled={toggleBlocked}
        onClick={(e) => e.stopPropagation()}
        onChange={handleToggle}
      />

      <div className={styles.body}>
        <div className={styles.topRow}>
          <div
            className={styles.titleGroup}
            role="link"
            tabIndex={0}
            onClick={goToDetail}
            onKeyDown={(e) => {
              if (e.key === "Enter") goToDetail(e);
            }}
          >
            <Badge tone={selected ? "accent" : "neutral"}>{item.targetLabel}</Badge>
            <span className={styles.title}>{item.title}</span>
          </div>

          <div className={styles.rightGroup}>
            <span className={styles.meta}>
              {item.author ? `${item.author} · ` : ""}
              {item.savedAt}
              {item.version ? ` · v${item.version}` : ""}
            </span>
            <Button
              variant="ghostDanger"
              size="icon"
              aria-label="이력 삭제"
              title="이력 삭제"
              onClick={(e) => e.stopPropagation()}
            >
              <Icon name="trash" size={14} />
            </Button>
          </div>
        </div>

        {item.changedPaths?.length > 0 && (
          <div className={styles.tags}>
            {item.changedPaths.map((path) => (
              <span key={path} className={styles.tag}>
                <span className={styles.tagDot} />
                {path}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
