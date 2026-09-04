import { useEffect, useState } from "react";
import styles from "./DbStatus.module.css";

function formatTime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export default function DbStatus() {
  const [lastSynced, setLastSynced] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setLastSynced(new Date()), 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.statusRow}>
      <span className={styles.ok}>● DB 연결됨 · {formatTime(lastSynced)} 갱신</span>
      <button
        type="button"
        className={styles.refreshBtn}
        title="10초마다 자동 갱신 · 눌러서 지금 갱신"
        onClick={() => setLastSynced(new Date())}
      >
        <span>⟳</span>
      </button>
    </div>
  );
}
