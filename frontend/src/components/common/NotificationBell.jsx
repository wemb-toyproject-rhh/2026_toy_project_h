import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useHistoryOptional } from "../../context/HistoryContext.jsx";
import Icon from "./Icon.jsx";
import styles from "./NotificationBell.module.css";

const MAX_ITEMS = 8;

// 읽음/안읽음은 아직 백엔드에 없어서(추후 백엔드 팀원과 별도 설계 예정), 지금은
// 세션 동안만 기억하는 lastSeenAt 기준으로 "새 이력"을 가립니다. HistoryContext의
// newEntryIds가 같은 기준을 이력 리스트 쪽(PRCard)과도 공유해서, 알림에 뜬 항목이
// 리스트에서도 동일하게 "새 이력"으로 보입니다. "전부 확인"을 누르면 기준 시각이
// 지금으로 당겨져서 알림/리스트 표시가 함께 사라집니다.
export default function NotificationBell() {
  const history = useHistoryOptional();
  const entries = history?.entries;
  const newEntryIds = history?.newEntryIds;
  const markAllSeen = history?.markAllSeen;
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

  const newEntries = useMemo(() => {
    if (!entries || !newEntryIds || newEntryIds.size === 0) return [];
    return entries
      .filter((entry) => newEntryIds.has(entry.id))
      .sort((a, b) => new Date(b.savedAtRaw) - new Date(a.savedAtRaw))
      .slice(0, MAX_ITEMS);
  }, [entries, newEntryIds]);

  // 패널엔 최대 MAX_ITEMS개만 보여주지만, 뱃지 숫자는 실제 새 이력 전체 개수입니다.
  const unreadCount = newEntryIds?.size ?? 0;

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
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>알림</span>
            <button
              type="button"
              className={styles.markAllBtn}
              disabled={newEntries.length === 0}
              onClick={() => markAllSeen?.()}
            >
              전부 확인
            </button>
          </div>

          {newEntries.length === 0 ? (
            <p className={styles.empty}>아직 알림이 없습니다</p>
          ) : (
            <ul className={styles.list}>
              {newEntries.map((entry) => (
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
