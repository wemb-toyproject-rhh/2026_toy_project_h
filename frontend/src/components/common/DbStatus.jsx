import { useEffect, useState } from "react";
import { useHistory } from "../../context/HistoryContext.jsx";
import styles from "./DbStatus.module.css";

function formatTime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export default function DbStatus() {
  const { loading, error, reload } = useHistory();
  const [lastSynced, setLastSynced] = useState(() => new Date());

  // 실제로 이력을 성공적으로 다시 불러온 시점(로딩이 끝났고 에러가 없을 때)에만
  // "갱신" 시각을 새로 찍습니다 — 화면에 보이는 시계가 아니라 진짜 동기화 시각입니다.
  useEffect(() => {
    if (!loading && !error) setLastSynced(new Date());
  }, [loading, error]);

  return (
    <div className={styles.statusRow}>
      {error ? (
        <span className={styles.fail}>● DB 연결 실패</span>
      ) : (
        <span className={styles.ok}>● DB 연결됨 · {formatTime(lastSynced)} 갱신</span>
      )}
      <button
        type="button"
        className={styles.refreshBtn}
        title="눌러서 지금 다시 불러오기"
        onClick={reload}
        disabled={loading}
      >
        <span className={loading ? styles.spinning : ""}>⟳</span>
      </button>
    </div>
  );
}
