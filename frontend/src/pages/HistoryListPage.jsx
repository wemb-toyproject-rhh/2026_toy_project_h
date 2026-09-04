import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  filterEntriesByTarget,
  historyEntries,
  updateEntryTitle,
} from "../mocks/historyAdapter.js";
import PRCard from "../components/history/PRCard.jsx";
import Button from "../components/common/Button.jsx";
import Icon from "../components/common/Icon.jsx";
import styles from "./HistoryListPage.module.css";

const TYPE_LABELS = { css: "CSS", html: "HTML", js: "JAVASCRIPT" };

export default function HistoryListPage() {
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [, forceRerender] = useReducer(n => n + 1, 0);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterWrapRef = useRef(null);

  // Filter/sort criteria live in the URL (not local state) so they survive
  // navigating to a detail/compare page and back via BackLink or browser back.
  const updateParams = updates => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, value]) => {
        if (!value) next.delete(key);
        else next.set(key, value);
      });
      return next;
    });
  };

  useEffect(() => {
    if (!filterOpen) return undefined;

    const handlePointerDown = e => {
      if (!filterWrapRef.current?.contains(e.target)) setFilterOpen(false);
    };
    const handleKeyDown = e => {
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
    ? historyEntries.find(entry => entry.targetId === targetId)?.targetLabel
    : null;

  const sortOrder = searchParams.get("sort") === "asc" ? "asc" : "desc";
  const dateFrom = searchParams.get("from") ?? "";
  const dateTo = searchParams.get("to") ?? "";
  const activeTypes = (searchParams.get("types") ?? "")
    .split(",")
    .filter(type => TYPE_LABELS[type]);
  const typeFilters = {
    css: activeTypes.includes("css"),
    html: activeTypes.includes("html"),
    js: activeTypes.includes("js"),
  };

  const entries = useMemo(() => {
    let list = filterEntriesByTarget(targetId);

    if (dateFrom) {
      const from = new Date(dateFrom);
      list = list.filter(entry => new Date(entry.savedAtRaw) >= from);
    }
    if (dateTo) {
      const to = new Date(`${dateTo}T23:59:59.999`);
      list = list.filter(entry => new Date(entry.savedAtRaw) <= to);
    }
    if (activeTypes.length > 0) {
      list = list.filter(entry =>
        entry.primaryTabs.some(
          tab => activeTypes.includes(tab.id) && tab.modified,
        ),
      );
    }

    return [...list].sort((a, b) => {
      const diff = new Date(a.savedAtRaw) - new Date(b.savedAtRaw);
      return sortOrder === "asc" ? diff : -diff;
    });
  }, [targetId, dateFrom, dateTo, sortOrder, activeTypes]);

  const hasDateFilter = Boolean(dateFrom || dateTo);
  const hasTypeFilter = activeTypes.length > 0;
  const dateRangeLabel =
    dateFrom && dateTo
      ? `${dateFrom} ~ ${dateTo}`
      : dateFrom
        ? `${dateFrom} 이후`
        : `${dateTo} 이전`;
  const typeFilterLabel = activeTypes.map(type => TYPE_LABELS[type]).join(", ");
  const clearDateFilter = () => updateParams({ from: null, to: null });
  const clearTypeFilter = () => updateParams({ types: null });
  const toggleTypeFilter = type => {
    const next = activeTypes.includes(type)
      ? activeTypes.filter(t => t !== type)
      : [...activeTypes, type];
    updateParams({ types: next.join(",") || null });
  };
  const toggleSortOrder = () =>
    updateParams({ sort: sortOrder === "desc" ? "asc" : null });

  const selectedTargetId =
    selectedIds.length > 0
      ? historyEntries.find(entry => entry.id === selectedIds[0])?.targetId
      : null;

  const toggleSelect = id => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(existing => existing !== id);
      if (prev.length >= 2) return prev;
      if (prev.length === 1) {
        const firstTargetId = historyEntries.find(entry => entry.id === prev[0])?.targetId;
        const nextTargetId = historyEntries.find(entry => entry.id === id)?.targetId;
        if (firstTargetId !== nextTargetId) return prev;
      }
      return [...prev, id];
    });
  };

  const canCompare = selectedIds.length === 2;
  const clearSelection = () => setSelectedIds([]);

  return (
    <div className={styles.page}>
      <div className={styles.searchBar} ref={filterWrapRef}>
        <button
          type="button"
          className={styles.filterToggle}
          aria-haspopup="true"
          aria-expanded={filterOpen}
          onClick={() => setFilterOpen(v => !v)}
        >
          필터
          {(hasDateFilter || hasTypeFilter) && (
            <span className={styles.filterDot} />
          )}
          <Icon name="chevron" size={10} className={styles.filterChevron} />
        </button>

        <span className={styles.searchDivider} />

        <input
          type="text"
          className={styles.searchInput}
          placeholder="컴포넌트명, 제목, 작성자로 검색..."
        />

        {filterOpen && (
          <div className={styles.filterPanel}>
            <div className={styles.filterSection}>
              <span className={styles.filterLabel}>변경 유형</span>
              <div className={styles.typeChips}>
                <button
                  type="button"
                  className={`${styles.typeChip} ${typeFilters.css ? styles.active : ""}`}
                  onClick={() => toggleTypeFilter("css")}
                >
                  <span className={`${styles.typeDot} ${styles.typeDotCss}`} />
                  CSS
                </button>
                <button
                  type="button"
                  className={`${styles.typeChip} ${typeFilters.html ? styles.active : ""}`}
                  onClick={() => toggleTypeFilter("html")}
                >
                  <span className={`${styles.typeDot} ${styles.typeDotHtml}`} />
                  HTML
                </button>
                <button
                  type="button"
                  className={`${styles.typeChip} ${typeFilters.js ? styles.active : ""}`}
                  onClick={() => toggleTypeFilter("js")}
                >
                  <span className={`${styles.typeDot} ${styles.typeDotJs}`} />
                  JAVASCRIPT
                </button>
              </div>
              {hasTypeFilter && (
                <button
                  type="button"
                  className={styles.dateReset}
                  onClick={clearTypeFilter}
                >
                  유형 초기화
                </button>
              )}
            </div>

            <div className={styles.filterSection}>
              <span className={styles.filterLabel}>기간</span>
              <div className={styles.dateRange}>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={e => updateParams({ from: e.target.value })}
                  aria-label="시작 날짜"
                />
                <span className={styles.dateSep}>~</span>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={e => updateParams({ to: e.target.value })}
                  aria-label="종료 날짜"
                />
              </div>
              {hasDateFilter && (
                <button
                  type="button"
                  className={styles.dateReset}
                  onClick={clearDateFilter}
                >
                  기간 초기화
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {(activeTargetLabel || hasDateFilter || hasTypeFilter) && (
        <div className={styles.activeFilters}>
          {activeTargetLabel && (
            <span className={styles.filterChip}>
              {activeTargetLabel}
              <button
                type="button"
                className={styles.filterClear}
                onClick={() => updateParams({ target: null })}
                aria-label="타겟 필터 해제"
                title="타겟 필터 해제"
              >
                <Icon name="close" size={9} />
              </button>
            </span>
          )}
          {hasDateFilter && (
            <span className={styles.filterChip}>
              기간: {dateRangeLabel}
              <button
                type="button"
                className={styles.filterClear}
                onClick={clearDateFilter}
                aria-label="기간 필터 해제"
                title="기간 필터 해제"
              >
                <Icon name="close" size={9} />
              </button>
            </span>
          )}
          {hasTypeFilter && (
            <span className={styles.filterChip}>
              유형: {typeFilterLabel}
              <button
                type="button"
                className={styles.filterClear}
                onClick={clearTypeFilter}
                aria-label="유형 필터 해제"
                title="유형 필터 해제"
              >
                <Icon name="close" size={9} />
              </button>
            </span>
          )}
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
              onClick={() =>
                navigate("/compare", { state: { ids: selectedIds } })
              }
            >
              Diff 비교 ({selectedIds.length}/2)
            </Button>
            <button
              type="button"
              className={styles.selectionClear}
              onClick={clearSelection}
              aria-label="선택 취소"
              title="선택 취소"
            >
              <Icon name="close" size={12} />
            </button>
          </div>
        </div>
      )}

      <div className={styles.listSection}>
        <div className={styles.listHeader}>
          <button
            type="button"
            className={styles.sortToggle}
            onClick={toggleSortOrder}
            aria-label={
              sortOrder === "desc"
                ? "최신순 (클릭 시 오래된순)"
                : "오래된순 (클릭 시 최신순)"
            }
            title={sortOrder === "desc" ? "최신순" : "오래된순"}
          >
            <Icon name="sortArrows" size={13} direction={sortOrder} />
            {sortOrder === "asc" && <span className={styles.sortDot} />}
          </button>
        </div>

        <div className={styles.list}>
          {entries.map(item => (
            <PRCard
              key={item.id}
              item={item}
              selected={selectedIds.includes(item.id)}
              selectionDisabled={
                selectedIds.length >= 2 ||
                (selectedIds.length === 1 && item.targetId !== selectedTargetId)
              }
              onToggleSelect={toggleSelect}
              onRenameTitle={handleRenameTitle}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
