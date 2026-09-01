import { Link } from "react-router-dom";
import mockHistory from "../mocks/mockHistory.json";
import PRCard from "../components/history/PRCard.jsx";
import Button from "../components/common/Button.jsx";
import styles from "./HistoryListPage.module.css";

export default function HistoryListPage() {
  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <input
          type="text"
          className={styles.search}
          placeholder="이력 제목, 작성자, 스크립트 검색..."
        />
        <Link to="/compare">
          <Button variant="primary">선택한 2개 이력 Diff 비교 (2/2)</Button>
        </Link>
      </div>

      <div className={styles.list}>
        {mockHistory.history.map((item) => (
          <PRCard key={item.id} item={item} highlighted={item.id === 12} />
        ))}
      </div>
    </div>
  );
}
