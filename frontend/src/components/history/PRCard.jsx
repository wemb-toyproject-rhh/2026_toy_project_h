import { useNavigate } from "react-router-dom";
import Badge from "../common/Badge.jsx";
import Button from "../common/Button.jsx";
import Icon from "../common/Icon.jsx";
import EditableTitle from "../common/EditableTitle.jsx";
import DiffStatBadge from "../common/DiffStatBadge.jsx";
import styles from "./PRCard.module.css";

export default function PRCard({
  item,
  selected = false,
  selectionDisabled = false,
  onToggleSelect,
  onRenameTitle,
  onHide,
}) {
  const navigate = useNavigate();
  const toggleBlocked = !selected && selectionDisabled;

  const handleToggle = () => {
    if (toggleBlocked) return;
    onToggleSelect(item.id);
  };

  const goToDetail = () => navigate(`/history/${item.id}`);

  return (
    <div
      className={`${styles.card} ${selected ? styles.highlighted : ""} ${toggleBlocked ? styles.disabled : ""}`}
    >
      <div
        className={styles.checkboxZone}
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
      </div>

      <div
        className={styles.body}
        role="link"
        tabIndex={0}
        onClick={goToDetail}
        onKeyDown={(e) => {
          if (e.key === "Enter") goToDetail();
        }}
      >
        <div className={styles.topRow}>
          <div className={styles.titleGroup}>
            <Badge tone={selected ? "accent" : "neutral"}>{item.targetLabel}</Badge>
            <EditableTitle
              value={item.title}
              className={styles.title}
              onSave={(newTitle) => onRenameTitle?.(item.id, newTitle)}
            />
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
              title="이력 삭제 (실제로는 숨김 처리되며, 원본 데이터는 삭제되지 않습니다)"
              onClick={(e) => {
                e.stopPropagation();
                onHide?.(item.id);
              }}
            >
              <Icon name="trash" size={14} />
            </Button>
          </div>
        </div>

        {(item.changedPaths?.length > 0 || item.additions + item.deletions > 0) && (
          <div className={styles.tagsRow}>
            <div className={styles.tags}>
              {item.changedPaths?.map((path) => (
                <span key={path} className={styles.tag}>
                  <span className={styles.tagDot} />
                  {path}
                </span>
              ))}
            </div>
            <DiffStatBadge additions={item.additions} deletions={item.deletions} />
          </div>
        )}
      </div>
    </div>
  );
}
