import { useEffect } from "react";
import Icon from "./Icon.jsx";
import styles from "./ShortcutsModal.module.css";

const SHORTCUT_GROUPS = [
  {
    title: "이력 전체보기",
    items: [
      { keys: ["/"], description: "검색창 포커스" },
      { keys: ["J", "↓"], description: "다음 카드로 이동" },
      { keys: ["K", "↑"], description: "이전 카드로 이동" },
      { keys: ["Enter"], description: "포커스된 카드 열기" },
    ],
  },
  {
    title: "이력 상세",
    items: [
      { keys: ["["], description: "이전 이력" },
      { keys: ["]"], description: "다음 이력" },
      { keys: ["S"], description: "중요 표시 토글" },
    ],
  },
  {
    title: "공통",
    items: [
      { keys: ["Esc"], description: "닫기 / 뒤로가기" },
      { keys: ["?"], description: "이 안내 열기/닫기" },
    ],
  },
];

export default function ShortcutsModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-label="키보드 단축키">
        <div className={styles.header}>
          <h2 className={styles.title}>키보드 단축키</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="닫기">
            <Icon name="close" size={13} />
          </button>
        </div>

        {SHORTCUT_GROUPS.map((group) => (
          <div key={group.title} className={styles.group}>
            <span className={styles.groupTitle}>{group.title}</span>
            <div className={styles.list}>
              {group.items.map((item) => (
                <div key={item.description} className={styles.row}>
                  <span className={styles.desc}>{item.description}</span>
                  <span className={styles.keys}>
                    {item.keys.map((key) => (
                      <kbd key={key} className={styles.key}>
                        {key}
                      </kbd>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
