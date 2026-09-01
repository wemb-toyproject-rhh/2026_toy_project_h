import { useState } from "react";
import Button from "../common/Button.jsx";
import styles from "./ConversationPanel.module.css";

export default function ConversationPanel({ note }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.raw);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Conversation · 상세 비고</span>
        {!editing ? (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            비고 수정
          </Button>
        ) : (
          <div className={styles.actions}>
            <Button variant="primary" size="sm" onClick={() => setEditing(false)}>
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
          <strong>작업 내용 요약</strong>
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
