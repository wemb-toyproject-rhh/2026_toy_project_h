import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ConfirmModal from "../common/ConfirmModal.jsx";
import { TYPE_COLORS } from "../../constants/historyFilterOptions.js";
import { diffLines, countChanges } from "../../utils/diff.js";
import styles from "./PRCard.module.css";

const COMMENT_MAX = 1000;
const DELETE_CONFIRM_WORD = "이력";

export default function PRCard({
  item,
  highlighted = false,
  checked,
  checkboxDisabled = false,
  onToggle,
  onSaveComment,
  onDelete,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.comment ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [diffStats, setDiffStats] = useState(null);
  const inputRef = useRef(null);

  const deleteItem = async () => {
    await onDelete(item.id);
    setConfirmOpen(false);
  };

  // 최신 이력과 비교한 전체 +/- 줄 수. id 당 한 번만 불러와서 캐시합니다.
  useEffect(() => {
    let cancelled = false;
    const at = item.id.indexOf("-");
    const kind = item.id.slice(0, at);
    const histId = item.id.slice(at + 1);

    fetch(`/api/history/${kind}/${histId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((detail) => {
        if (cancelled || !detail) return;
        const totals = (detail.sections ?? []).reduce(
          (acc, section) => {
            const counts = countChanges(diffLines(section.latest, section.current));
            acc.added += counts.added;
            acc.removed += counts.removed;
            return acc;
          },
          { added: 0, removed: 0 },
        );
        setDiffStats(totals);
      })
      .catch(() => {
        // 실패해도 배지 없이 조용히 넘어갑니다.
      });

    return () => {
      cancelled = true;
    };
  }, [item.id]);

  // 목록이 갱신되면 편집 중이 아닐 때만 값을 맞춥니다.
  useEffect(() => {
    if (!editing) setDraft(item.comment ?? "");
  }, [item.comment, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const startEdit = () => {
    setDraft(item.comment ?? "");
    setError("");
    setEditing(true);
  };

  const cancel = () => {
    setDraft(item.comment ?? "");
    setError("");
    setEditing(false);
  };

  const save = async () => {
    if (!onSaveComment) return setEditing(false);

    setSaving(true);
    setError("");
    try {
      await onSaveComment(item.id, draft);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const onKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      save();
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancel();
    }
  };

  return (
    <>
      <div className={`${styles.card} ${highlighted ? styles.highlighted : ""}`}>
        <input
          type="checkbox"
          className={styles.checkbox}
          aria-label="비교 대상으로 선택"
          checked={checked ?? false}
          disabled={checkboxDisabled}
          title={checkboxDisabled ? "이미 2개를 선택했습니다. 먼저 선택을 해제해 주세요." : undefined}
          onChange={() => onToggle?.(item.id)}
        />

        <div className={styles.body}>
          <div className={styles.topRow}>
            <div className={styles.titleGroup}>
              <Link to={`/history/${item.id}`} className={styles.title}>
                {item.title}
              </Link>

              {/* 비고를 목록에서 바로 보고, 눌러서 바로 고칠 수 있습니다. */}
              {editing ? (
                <span className={styles.commentEdit}>
                  <input
                    ref={inputRef}
                    type="text"
                    className={styles.commentEditInput}
                    value={draft}
                    maxLength={COMMENT_MAX}
                    disabled={saving}
                    placeholder="비고를 입력하세요"
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={onKeyDown}
                  />
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={save}
                    disabled={saving}
                    title="저장 (Enter)"
                  >
                    {saving ? "…" : "✓"}
                  </button>
                  <button
                    type="button"
                    className={`${styles.iconBtn} ${styles.iconBtnCancel}`}
                    onClick={cancel}
                    disabled={saving}
                    title="취소 (Esc)"
                  >
                    ✕
                  </button>
                </span>
              ) : (
                <span className={styles.commentView}>
                  <span
                    className={`${styles.commentText} ${item.comment ? "" : styles.commentEmpty}`}
                    title={item.comment || "비고 없음"}
                  >
                    {item.comment || "비고 없음"}
                  </span>
                  <button
                    type="button"
                    className={styles.editIcon}
                    title="비고 수정"
                    onClick={startEdit}
                  >
                    ✎
                  </button>
                </span>
              )}
              {error && <span className={styles.commentError}>{error}</span>}
            </div>

            <div className={styles.meta}>
              작성자 {item.author} · 저장 {item.savedAt}
            </div>

            <div className={styles.actionsCol}>
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={() => setConfirmOpen(true)}
                disabled={!onDelete}
                title={onDelete ? "이력 삭제" : "샘플 데이터는 삭제할 수 없습니다"}
                aria-label="이력 삭제"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>

              {diffStats && (diffStats.added > 0 || diffStats.removed > 0) && (
                <span className={styles.diffStats} title="최신 이력과 비교한 변경 줄 수">
                  <span className={styles.diffAdded}>+{diffStats.added}</span>
                  <span className={styles.diffRemoved}>-{diffStats.removed}</span>
                </span>
              )}
            </div>
          </div>

          {item.changes?.length > 0 && (
            <div className={styles.changes}>
              {item.changes.map((change, idx) => (
                <span key={idx} className={styles.changeTag}>
                  <span
                    className={styles.tagDot}
                    style={{ background: TYPE_COLORS[change.type] }}
                  />
                  {change.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="이력 삭제"
        description={`"${item.title}" 이력을 삭제합니다. 삭제하면 되돌릴 수 없습니다.`}
        confirmWord={DELETE_CONFIRM_WORD}
        onConfirm={deleteItem}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
