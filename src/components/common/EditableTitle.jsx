import { useEffect, useRef, useState } from "react";
import Icon from "./Icon.jsx";
import styles from "./EditableTitle.module.css";

export default function EditableTitle({ value, onSave, className = "" }) {
  const [editing, setEditing] = useState(false);
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
      <span className={`${styles.text} ${className}`}>{value}</span>
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
