import { useEffect, useState } from "react";
import Icon from "./Icon.jsx";
import ShortcutsModal from "./ShortcutsModal.jsx";
import styles from "./ShortcutsHelp.module.css";

function isTypingTarget(target) {
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
}

export default function ShortcutsHelp() {
  const [open, setOpen] = useState(false);

  // "?" 는 화면(목록/상세/휴지통 등)에 관계없이 어디서든 켜고 끌 수 있어야 해서
  // 헤더(모든 화면에 떠 있음)에 전역으로 둡니다.
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== "?" || isTypingTarget(e.target)) return;
      setOpen((prev) => !prev);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(true)}
        aria-label="키보드 단축키 안내"
        title="키보드 단축키 안내 (?)"
      >
        <Icon name="help" size={17} />
      </button>
      <ShortcutsModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
