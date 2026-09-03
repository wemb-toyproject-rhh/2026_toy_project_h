import { useEffect, useState } from "react";
import Button from "../common/Button.jsx";
import styles from "./ConversationPanel.module.css";

/**
 * onSave 를 넘기면 저장 버튼이 실제로 서버에 반영합니다.
 * 넘기지 않으면 화면 안에서만 편집됩니다(기존 동작).
 */
export default function ConversationPanel({ note, onSave, maxLength = 1000 }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.raw ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // 다른 이력으로 이동하면 편집 상태를 초기화합니다.
  useEffect(() => {
    setDraft(note.raw ?? "");
    setEditing(false);
    setSaving(false);
    setMessage("");
  }, [note.raw]);

  const cancel = () => {
    setDraft(note.raw ?? "");
    setEditing(false);
    setMessage("");
  };

  const save = async () => {
    if (!onSave) {
      setEditing(false);
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      await onSave(draft);
      setEditing(false);
      setMessage("저장했습니다.");
    } catch (err) {
      setMessage(`저장 실패 — ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const tooLong = draft.length > maxLength;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Conversation · 상세 비고</span>

        {!editing ? (
          <div className={styles.actions}>
            {message && <span className={styles.status}>{message}</span>}
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              비고 수정
            </Button>
          </div>
        ) : (
          <div className={styles.actions}>
            <span className={`${styles.counter} ${tooLong ? styles.over : ""}`}>
              {draft.length} / {maxLength}
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={save}
              disabled={saving || tooLong}
            >
              {saving ? "저장 중..." : "저장"}
            </Button>
            <Button variant="ghost" size="sm" onClick={cancel} disabled={saving}>
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
        <>
          <textarea
            className={styles.editMode}
            value={draft}
            maxLength={maxLength}
            disabled={saving}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="이 이력에 대한 비고를 입력하세요."
          />
          {message && <span className={styles.status}>{message}</span>}
        </>
      )}
    </div>
  );
}
