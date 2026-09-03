import { useEffect, useRef, useState } from "react";
import Button from "./Button.jsx";
import styles from "./ConfirmModal.module.css";

/**
 * 타이핑 확인이 필요한 확인 모달.
 * confirmWord 를 정확히 입력해야 confirmLabel 버튼이 활성화됩니다.
 * onConfirm 이 실패(reject)하면 모달을 닫지 않고 에러만 보여줍니다.
 */
export default function ConfirmModal({
  open,
  title,
  description,
  confirmWord,
  confirmLabel = "삭제",
  onConfirm,
  onCancel,
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setInput("");
    setLoading(false);
    setError("");
    // 다음 페인트 이후 포커스해야 확실히 잡힙니다.
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  if (!open) return null;

  const matched = input === confirmWord;

  const confirm = async () => {
    if (!matched || loading) return;
    setLoading(true);
    setError("");
    try {
      await onConfirm();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const onKeyDown = (event) => {
    if (event.key === "Escape") onCancel();
    if (event.key === "Enter") confirm();
  };

  return (
    <div className={styles.overlay} onMouseDown={onCancel}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <strong className={styles.title}>{title}</strong>
        {description && <p className={styles.description}>{description}</p>}

        <label className={styles.label}>
          계속하려면 <strong>{confirmWord}</strong>(을)를 입력하세요.
        </label>
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          value={input}
          disabled={loading}
          onChange={(event) => setInput(event.target.value)}
          placeholder={confirmWord}
        />

        {error && <p className={styles.error}>삭제 실패 — {error}</p>}

        <div className={styles.actions}>
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading}>
            취소
          </Button>
          <Button variant="danger" size="sm" onClick={confirm} disabled={!matched || loading}>
            {loading ? "삭제 중..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
