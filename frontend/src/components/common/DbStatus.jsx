import { useHistory } from "../../context/HistoryContext.jsx";
import styles from "./DbStatus.module.css";

function formatTime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export default function DbStatus() {
  const { loading, error, reload, lastFetchedAt } = useHistory();

  return (
    <div className={styles.statusRow}>
      {error ? (
        <span className={styles.fail}>● DB 연결 실패</span>
      ) : (
        <span className={styles.ok}>
          ● DB 연결됨{lastFetchedAt ? ` · ${formatTime(lastFetchedAt)} 갱신` : ""}
        </span>
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
