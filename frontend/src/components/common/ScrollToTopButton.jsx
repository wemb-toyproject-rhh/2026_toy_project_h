import { useEffect, useState } from "react";
import Icon from "./Icon.jsx";
import styles from "./ScrollToTopButton.module.css";

const SHOW_THRESHOLD = 200;

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const container = document.querySelector("[data-scroll-container]");
    if (!container) return undefined;

    const handleScroll = () => setVisible(container.scrollTop > SHOW_THRESHOLD);
    handleScroll();

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    const container = document.querySelector("[data-scroll-container]");
    if (!container) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    container.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      className={styles.button}
      onClick={scrollToTop}
      aria-label="맨 위로 이동"
      title="맨 위로 이동"
    >
      <Icon name="chevron" size={14} className={styles.icon} />
    </button>
  );
}
