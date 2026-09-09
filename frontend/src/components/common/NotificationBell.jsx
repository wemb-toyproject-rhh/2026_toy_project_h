import { useEffect, useRef, useState } from "react";
import Icon from "./Icon.jsx";
import styles from "./NotificationBell.module.css";

// 아직 실제 알림 데이터/백엔드가 없는 자리 표시용 버튼입니다. 나중에 알림
// 기능이 생기면 이 안의 빈 상태만 목록으로 바꾸면 됩니다.
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.bellBtn}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="알림"
        title="알림"
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="bell" size={17} />
      </button>

      {open && (
        <div className={styles.panel}>
          <span className={styles.panelTitle}>알림</span>
          <p className={styles.empty}>아직 알림이 없습니다</p>
        </div>
      )}
    </div>
  );
}
