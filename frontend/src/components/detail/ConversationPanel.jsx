import { useState } from "react";
import Button from "../common/Button.jsx";
import styles from "./ConversationPanel.module.css";

export default function ConversationPanel({ note, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.raw);

  const startEdit = () => {
    setDraft(note.raw);
    setEditing(true);
  };

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed !== note.raw) onSave?.(trimmed);
    setEditing(false);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Description</span>
        {!editing ? (
          <Button variant="ghost" size="sm" onClick={startEdit}>
            수정
          </Button>
        ) : (
          <div className={styles.actions}>
            <Button variant="primary" size="sm" onClick={commit}>
              저장
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraft(note.raw);
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
        <textarea
          className={styles.editMode}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      )}
    </div>
  );
}
