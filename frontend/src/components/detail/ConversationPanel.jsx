import { useState } from "react";
import Button from "../common/Button.jsx";
import styles from "./ConversationPanel.module.css";

const COMMENT_MAX = 500;

export default function ConversationPanel({ note, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.raw);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const startEdit = () => {
    setDraft(note.raw);
    setError("");
    setEditing(true);
  };

  const commit = async () => {
    const trimmed = draft.trim();
    if (trimmed === note.raw) {
      setEditing(false);
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSave?.(trimmed);
      setEditing(false);
    } catch (err) {
      setError(err.message || "저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>메모</span>
        {!editing ? (
          <Button variant="ghost" size="sm" onClick={startEdit}>
            수정
          </Button>
        ) : (
          <div className={styles.actions}>
            <Button variant="primary" size="sm" onClick={commit} disabled={saving}>
              {saving ? "저장 중..." : "저장"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={saving}
              onClick={() => {
                setDraft(note.raw);
                setError("");
                setEditing(false);
              }}
            >
              취소
            </Button>
          </div>
        )}
      </div>

      {!editing ? (
        <div className={styles.viewMode}>
          <p>{note.summary}</p>
        </div>
      ) : (
        <>
          <textarea
            className={styles.editMode}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={COMMENT_MAX}
            readOnly={saving}
          />
          <div className={styles.editFooter}>
            {error && <span className={styles.error}>{error}</span>}
            <span className={styles.charCount}>
              {draft.length}/{COMMENT_MAX}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
