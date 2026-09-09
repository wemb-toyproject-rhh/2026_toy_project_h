import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useHistoryOptional } from "../../context/HistoryContext.jsx";
import Icon from "./Icon.jsx";
import styles from "./NotificationBell.module.css";

const MAX_ITEMS = 8;

// 읽음/안읽음은 아직 백엔드에 없어서(추후 백엔드 팀원과 별도 설계 예정), 지금은
// UI 틀만 구성합니다 — 최근 이력을 그대로 보여주고, "전부 확인"은 이 세션 동안만
// 목록을 비워 보이게 하는 로컬 동작입니다. 새로고침하면 다시 보입니다.
export default function NotificationBell() {
  const history = useHistoryOptional();
  const entries = history?.entries;
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
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

  const recentEntries = useMemo(() => {
    if (dismissed || !entries) return [];
    return [...entries]
      .sort((a, b) => new Date(b.savedAtRaw) - new Date(a.savedAtRaw))
      .slice(0, MAX_ITEMS);
  }, [entries, dismissed]);

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
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>알림</span>
            <button
              type="button"
              className={styles.markAllBtn}
              disabled={recentEntries.length === 0}
              onClick={() => setDismissed(true)}
            >
              전부 확인
            </button>
          </div>

          {recentEntries.length === 0 ? (
            <p className={styles.empty}>아직 알림이 없습니다</p>
          ) : (
            <ul className={styles.list}>
              {recentEntries.map((entry) => (
                <li key={entry.id}>
                  <Link
                    to={`/history/${entry.id}`}
                    className={styles.item}
                    onClick={() => setOpen(false)}
                  >
                    <span className={styles.dot} aria-hidden="true" />
                    <span className={styles.itemBody}>
                      <span className={styles.itemTitleRow}>
                        <span className={styles.itemTarget}>{entry.targetLabel}</span>
                        <span className={styles.itemTitle}>{entry.title}</span>
                      </span>
                      <span className={styles.itemTime}>{entry.savedAt}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
