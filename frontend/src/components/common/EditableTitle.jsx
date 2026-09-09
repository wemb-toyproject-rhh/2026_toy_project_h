import { useEffect, useRef, useState } from "react";
import Icon from "./Icon.jsx";
import styles from "./EditableTitle.module.css";

export default function EditableTitle({
  value,
  onSave,
  className = "",
  editing: controlledEditing,
  onEditingChange,
}) {
  // 목록 화면처럼 카드가 여러 개 있을 때 "한 번에 하나만 수정 모드"로 유지하고 싶은
  // 곳은 editing/onEditingChange를 넘겨 상위에서 제어하고, 그 외(상세 페이지 제목 등
  // 인스턴스가 하나뿐인 곳)는 두 prop을 안 넘기면 예전처럼 내부 상태로 동작합니다.
  const isControlled = controlledEditing !== undefined;
  const [internalEditing, setInternalEditing] = useState(false);
  const editing = isControlled ? controlledEditing : internalEditing;
  const setEditing = (next) => {
    if (isControlled) onEditingChange?.(next);
    else setInternalEditing(next);
  };
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const startEdit = (e) => {
    e.stopPropagation();
    setDraft(value);
    setEditing(true);
  };

  const commit = (e) => {
    e.stopPropagation();
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    setEditing(false);
  };

  const cancel = (e) => {
    e.stopPropagation();
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <span className={styles.editWrap} onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className={`${styles.input} ${className}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") commit(e);
            if (e.key === "Escape") cancel(e);
          }}
        />
        <button
          type="button"
          className={`${styles.iconBtn} ${styles.save}`}
          onClick={commit}
          aria-label="제목 저장"
          title="제목 저장"
        >
          <Icon name="check" size={12} />
        </button>
        <button
          type="button"
          className={`${styles.iconBtn} ${styles.cancel}`}
          onClick={cancel}
          aria-label="수정 취소"
          title="수정 취소"
        >
          <Icon name="close" size={12} />
        </button>
      </span>
    );
  }

  return (
    <span className={styles.viewWrap}>
      <span className={`${styles.text} ${className}`} title={value}>
        {value}
      </span>
      <button
        type="button"
        className={styles.editBtn}
        onClick={startEdit}
        aria-label="제목 수정"
        title="제목 수정"
      >
        <Icon name="pencil" size={12} />
      </button>
    </span>
  );
}
