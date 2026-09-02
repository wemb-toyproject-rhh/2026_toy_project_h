import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { filterEntriesByTarget, historyEntries, updateEntryTitle } from "../mocks/historyAdapter.js";
import PRCard from "../components/history/PRCard.jsx";
import Button from "../components/common/Button.jsx";
import Icon from "../components/common/Icon.jsx";
import styles from "./HistoryListPage.module.css";

export default function HistoryListPage() {
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [, forceRerender] = useReducer((n) => n + 1, 0);
  const [sortOrder, setSortOrder] = useState("desc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterWrapRef = useRef(null);

  useEffect(() => {
    if (!filterOpen) return undefined;

    const handlePointerDown = (e) => {
      if (!filterWrapRef.current?.contains(e.target)) setFilterOpen(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setFilterOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [filterOpen]);

  const handleRenameTitle = (id, newTitle) => {
    updateEntryTitle(id, newTitle);
    forceRerender();
  };

  const targetId = searchParams.get("target");
  const activeTargetLabel = targetId
    ? historyEntries.find((entry) => entry.targetId === targetId)?.targetLabel
    : null;

  const entries = useMemo(() => {
    let list = filterEntriesByTarget(targetId);

    if (dateFrom) {
      const from = new Date(dateFrom);
      list = list.filter((entry) => new Date(entry.savedAtRaw) >= from);
    }
    if (dateTo) {
      const to = new Date(`${dateTo}T23:59:59.999`);
      list = list.filter((entry) => new Date(entry.savedAtRaw) <= to);
    }

    return [...list].sort((a, b) => {
      const diff = new Date(a.savedAtRaw) - new Date(b.savedAtRaw);
      return sortOrder === "asc" ? diff : -diff;
    });
  }, [targetId, dateFrom, dateTo, sortOrder]);

  const hasDateFilter = Boolean(dateFrom || dateTo);
  const clearDateFilter = () => {
    setDateFrom("");
    setDateTo("");
  };
  const toggleSortOrder = () => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));

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
      <div className={styles.searchBar} ref={filterWrapRef}>
        <button
          type="button"
          className={styles.filterToggle}
          aria-haspopup="true"
          aria-expanded={filterOpen}
          onClick={() => setFilterOpen((v) => !v)}
        >
          기간
          {hasDateFilter && <span className={styles.filterDot} />}
          <Icon name="chevron" size={10} className={styles.filterChevron} />
        </button>

        <span className={styles.searchDivider} />

        <Icon name="search" size={14} className={styles.searchIcon} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder="이력 제목, 작성자, 스크립트 검색..."
        />

        {filterOpen && (
          <div className={styles.filterPanel}>
            <div className={styles.filterSection}>
              <span className={styles.filterLabel}>기간</span>
              <div className={styles.dateRange}>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(e) => setDateFrom(e.target.value)}
                  aria-label="시작 날짜"
                />
                <span className={styles.dateSep}>~</span>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(e) => setDateTo(e.target.value)}
                  aria-label="종료 날짜"
                />
              </div>
              {hasDateFilter && (
                <button type="button" className={styles.dateReset} onClick={clearDateFilter}>
                  기간 초기화
                </button>
              )}
            </div>
          </div>
        )}
      </div>

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

      <div className={styles.listSection}>
        <div className={styles.listHeader}>
          <button
            type="button"
            className={styles.sortToggle}
            onClick={toggleSortOrder}
            aria-label={sortOrder === "desc" ? "최신순 (클릭 시 오래된순)" : "오래된순 (클릭 시 최신순)"}
            title={sortOrder === "desc" ? "최신순" : "오래된순"}
          >
            <Icon name="sortArrows" size={13} direction={sortOrder} />
            {sortOrder === "asc" && <span className={styles.sortDot} />}
          </button>
        </div>

        <div className={styles.list}>
          {entries.map((item) => (
            <PRCard
              key={item.id}
              item={item}
              selected={selectedIds.includes(item.id)}
              selectionDisabled={selectedIds.length >= 2}
              onToggleSelect={toggleSelect}
              onRenameTitle={handleRenameTitle}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
