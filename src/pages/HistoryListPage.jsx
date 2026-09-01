import { useState } from "react";
import { useNavigate } from "react-router-dom";
import mockHistory from "../mocks/mockHistory.json";
import PRCard from "../components/history/PRCard.jsx";
import Button from "../components/common/Button.jsx";
import styles from "./HistoryListPage.module.css";

export default function HistoryListPage() {
  const [selectedIds, setSelectedIds] = useState([]);
  const navigate = useNavigate();

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((existing) => existing !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  };

  const canCompare = selectedIds.length === 2;

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <input
          type="text"
          className={styles.search}
          placeholder="이력 제목, 작성자, 스크립트 검색..."
        />
        <Button
          variant="primary"
          disabled={!canCompare}
          onClick={() => navigate("/compare", { state: { ids: selectedIds } })}
        >
          선택한 이력 Diff 비교 ({selectedIds.length}/2)
        </Button>
      </div>

      <div className={styles.list}>
        {mockHistory.history.map((item) => (
          <PRCard
            key={item.id}
            item={item}
            selected={selectedIds.includes(item.id)}
            selectionDisabled={selectedIds.length >= 2}
            onToggleSelect={toggleSelect}
          />
        ))}
      </div>
    </div>
  );
}
