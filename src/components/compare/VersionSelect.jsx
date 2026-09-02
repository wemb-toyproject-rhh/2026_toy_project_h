import { useEffect, useRef, useState } from "react";
import Icon from "../common/Icon.jsx";
import styles from "./VersionSelect.module.css";

export default function VersionSelect({ label, options, onSelect }) {
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
        className={styles.trigger}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.triggerText}>{label}</span>
        <Icon name="chevron" size={10} className={styles.chevron} />
      </button>

      {open && (
        <div className={styles.panel}>
          {options.length === 0 ? (
            <p className={styles.empty}>비교할 수 있는 이력이 없습니다</p>
          ) : (
            options.map((option) => (
              <button
                key={option.id}
                type="button"
                className={styles.option}
                onClick={() => {
                  onSelect(option.id);
                  setOpen(false);
                }}
              >
                <span className={styles.optionTitle}>{option.title}</span>
                <span className={styles.optionMeta}>
                  {option.savedAt}
                  {option.version ? ` · v${option.version}` : ""}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
