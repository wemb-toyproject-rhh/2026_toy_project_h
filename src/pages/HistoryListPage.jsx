import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { filterEntriesByTarget, historyEntries } from "../mocks/historyAdapter.js";
import PRCard from "../components/history/PRCard.jsx";
import Button from "../components/common/Button.jsx";
import styles from "./HistoryListPage.module.css";

export default function HistoryListPage() {
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const targetId = searchParams.get("target");
  const entries = filterEntriesByTarget(targetId);
  const activeTargetLabel = targetId
    ? historyEntries.find((entry) => entry.targetId === targetId)?.targetLabel
    : null;

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
      <input
        type="text"
        className={styles.search}
        placeholder="이력 제목, 작성자, 스크립트 검색..."
      />

      {activeTargetLabel && (
        <div className={styles.filterChip}>
          <span>{activeTargetLabel} 필터링 중</span>
          <Link to="/" className={styles.filterClear}>
            전체 보기
          </Link>
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className={styles.selectionBarWrap}>
          <div className={styles.selectionBar}>
            <span className={styles.selectionCount}>
              {selectedIds.length}개 선택됨 · 비교하려면 2개를 선택하세요
            </span>
            <Button
              variant="primary"
              disabled={!canCompare}
              onClick={() => navigate("/compare", { state: { ids: selectedIds } })}
            >
              선택한 이력 Diff 비교 ({selectedIds.length}/2)
            </Button>
          </div>
        </div>
      )}

      <div className={styles.list}>
        {entries.map((item) => (
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
