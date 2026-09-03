import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./NotificationBell.module.css";

// "2026-09-01T06:19:55.724Z" → "2026-09-01 06:19:55" (밀리초 제외)
function formatDate(value) {
  if (!value) return "-";
  return String(value).replace("T", " ").slice(0, 19);
}

/**
 * newItems / previousItems: [{ id, label, name, savedAt, author }]
 * label 은 "Page" | "2D" | "3D" 등 서버가 내려주는 값을 그대로 씁니다.
 */
export default function NotificationBell({ newItems = [], previousItems = [], onClear, onDismiss }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("new");
  const wrapRef = useRef(null);
  const newCount = newItems.length;

  useEffect(() => {
    if (!open) return;
    const onOutside = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  const toggleOpen = () => {
    // 열 때마다 "새 이력" 탭부터 보여줍니다.
    if (!open) setTab("new");
    setOpen((o) => !o);
  };

  const list = tab === "new" ? newItems : previousItems;
  const emptyMessage = tab === "new" ? "새 이력이 없습니다." : "이전 이력이 없습니다.";

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.bellBtn}
        onClick={toggleOpen}
        aria-label={newCount > 0 ? `새 이력 ${newCount}건` : "알림"}
        title={newCount > 0 ? `새 이력 ${newCount}건` : "새 이력 알림"}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {newCount > 0 && <span className={styles.badge}>{newCount > 9 ? "9+" : newCount}</span>}
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <div className={styles.tabs}>
              <button
                type="button"
                className={`${styles.tab} ${tab === "new" ? styles.tabActive : ""}`}
                onClick={() => setTab("new")}
              >
                새 이력{newCount > 0 ? ` ${newCount}` : ""}
              </button>
              <button
                type="button"
                className={`${styles.tab} ${tab === "previous" ? styles.tabActive : ""}`}
                onClick={() => setTab("previous")}
              >
                이전 이력
              </button>
            </div>
            {tab === "new" && newCount > 0 && (
              <button type="button" className={styles.clearBtn} onClick={onClear}>
                모두 읽음
              </button>
            )}
          </div>

          {list.length === 0 ? (
            <p className={styles.empty}>{emptyMessage}</p>
          ) : (
            <div className={styles.list}>
              {list.map((item) => (
                <Link
                  key={item.id}
                  to={`/history/${item.id}`}
                  className={styles.item}
                  onClick={() => {
                    if (tab === "new") onDismiss?.(item.id);
                    setOpen(false);
                  }}
                >
                  <span className={styles.itemLabel}>
                    [{item.label}] {item.name}
                  </span>
                  <span className={styles.itemMeta}>
                    {formatDate(item.savedAt)} · {item.author || "-"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
