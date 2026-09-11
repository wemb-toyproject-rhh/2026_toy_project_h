import { useEffect, useRef } from "react";
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
  isEditingTitle = false,
  onTitleEditingChange,
  isNew = false,
  isStarred = false,
  onToggleStar,
  focused = false,
}) {
  const navigate = useNavigate();
  const toggleBlocked = !selected && selectionDisabled;
  const bodyRef = useRef(null);

  // 목록 화면의 j/k 키보드 이동이 실제 DOM 포커스를 옮겨서 켜집니다 — 이 div가
  // 이미 role="link"/tabIndex/Enter 처리를 갖고 있어서 별도 로직 없이 재사용합니다.
  useEffect(() => {
    if (focused) bodyRef.current?.focus();
  }, [focused]);

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
        ref={bodyRef}
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
            {isNew && <span className={styles.newBadge}>새 이력</span>}
            <EditableTitle
              value={item.title}
              className={styles.title}
              onSave={(newTitle) => onRenameTitle?.(item.id, newTitle)}
              editing={isEditingTitle}
              onEditingChange={(next) => onTitleEditingChange?.(next ? item.id : null)}
            />
          </div>

          <div className={styles.rightGroup}>
            <span className={styles.meta}>
              {item.author ? `${item.author} · ` : ""}
              {item.savedAt}
              {item.version ? ` · v${item.version}` : ""}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className={`${styles.starBtn} ${isStarred ? styles.starActive : ""}`}
              aria-label={isStarred ? "중요 표시 해제" : "중요 표시"}
              title={isStarred ? "중요 표시 해제" : "중요 표시"}
              onClick={(e) => {
                e.stopPropagation();
                onToggleStar?.(item.id);
              }}
            >
              <Icon name="star" size={14} filled={isStarred} />
            </Button>
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
