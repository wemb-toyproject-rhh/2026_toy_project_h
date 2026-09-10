import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { filterEntriesByTarget } from "../services/historyAdapter.js";
import { useHistory } from "../context/HistoryContext.jsx";
import { useProjects } from "../context/ProjectContext.jsx";
import PRCard from "../components/history/PRCard.jsx";
import Button from "../components/common/Button.jsx";
import Icon from "../components/common/Icon.jsx";
import styles from "./HistoryListPage.module.css";

const TYPE_LABELS = { css: "CSS", html: "HTML", js: "JAVASCRIPT" };
const PAGE_SIZE = 24;
const UNDO_GRACE_MS = 4000;

export default function HistoryListPage() {
  const {
    entries: allEntries,
    loading,
    error,
    reload,
    updateMetadata,
    hasProject,
    newEntryIds,
    starredIds,
    toggleStar,
  } = useHistory();
  const { currentProject } = useProjects();
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [filterOpen, setFilterOpen] = useState(false);
  const filterWrapRef = useRef(null);
  // 카드가 여러 개라 한 번에 하나의 제목만 수정 모드로 열리게 합니다 — 새로 열면
  // 이전에 열려 있던 카드는 저장 없이(취소와 동일하게) 자동으로 닫힙니다.
  const [editingTitleId, setEditingTitleId] = useState(null);

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

  // 프로젝트를 바꾸면 이전 프로젝트에서 체크해둔 선택/필터/정렬을 이어가면 안 됩니다 —
  // 이력 id가 프로젝트(DB)별로 매겨져서 다른 프로젝트에 우연히 같은 id가 있으면 엉뚱한
  // 카드가 선택된 것처럼 보이거나, 존재하지 않는 타겟으로 필터링된 채 남을 수 있습니다.
  // lastProjectIdRef로 "진짜 전환"(A → B)만 골라내고, 최초 로딩 시의 undefined → 실제
  // id 전환(딥링크로 들어온 필터/정렬 값이 있을 수 있음)은 초기화하지 않습니다.
  const lastProjectIdRef = useRef(undefined);
  useEffect(() => {
    const id = currentProject?.id;
    if (id === undefined) return;
    if (lastProjectIdRef.current !== undefined && lastProjectIdRef.current !== id) {
      setSelectedIds([]);
      setEditingTitleId(null);
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        ["target", "q", "from", "to", "types", "sort"].forEach(key => next.delete(key));
        return next;
      });
    }
    lastProjectIdRef.current = id;
  }, [currentProject?.id, setSearchParams]);

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
    updateMetadata(id, { title: newTitle });
  };

  // "이력 삭제" 버튼 = 실제로는 hidden 플래그만 세우는 소프트 삭제입니다. 클릭 즉시
  // API를 호출하지 않고, 화면에서만 먼저 숨긴 뒤(pendingHideIds) 잠시(UNDO_GRACE_MS)
  // 기다렸다가 실제로 저장합니다 — 그사이 "실행 취소"를 누르면 API 호출 자체가 안
  // 일어납니다. 우다다 여러 개를 연달아 지워도 타이머가 매번 리셋되면서 하나의
  // 토스트/실행 취소로 묶입니다.
  const [pendingHideIds, setPendingHideIds] = useState([]);
  const pendingHideIdsRef = useRef(pendingHideIds);
  pendingHideIdsRef.current = pendingHideIds;
  const pendingHideTimerRef = useRef(null);

  const flushPendingHides = () => {
    if (pendingHideTimerRef.current) {
      clearTimeout(pendingHideTimerRef.current);
      pendingHideTimerRef.current = null;
    }
    const ids = pendingHideIdsRef.current;
    if (ids.length === 0) return;
    setPendingHideIds([]);
    ids.forEach((id) => updateMetadata(id, { hidden: true }));
  };

  const handleHide = (id) => {
    setPendingHideIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    if (pendingHideTimerRef.current) clearTimeout(pendingHideTimerRef.current);
    pendingHideTimerRef.current = setTimeout(flushPendingHides, UNDO_GRACE_MS);
  };

  const handleUndoHide = () => {
    if (pendingHideTimerRef.current) {
      clearTimeout(pendingHideTimerRef.current);
      pendingHideTimerRef.current = null;
    }
    setPendingHideIds([]);
  };

  // 프로젝트가 바뀌거나 이 페이지를 벗어나면(상세 화면 이동 등) 유예 시간을 더 기다리지
  // 않고 즉시 확정 저장합니다 — 그냥 버려두면 "삭제했다고 생각했는데 안 지워짐" 상태가 됩니다.
  useEffect(() => {
    return () => flushPendingHides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject?.id]);

  const targetId = searchParams.get("target");
  // 사이드바에는 자기 이력이 하나도 없는 페이지 노드(컴포넌트만 저장된 경우 pageTargetName으로
  // 만들어진 가상 노드)도 있을 수 있습니다 — 그런 페이지를 선택하면 targetId와 같은 targetId를
  // 가진 entry가 아예 없어서 아래 fallback(자식 entry의 pageTargetName)으로 라벨을 구합니다.
  const activeTargetLabel = targetId
    ? allEntries.find(entry => entry.targetId === targetId)?.targetLabel
      ?? (allEntries.find(entry => entry.pageTargetId === targetId)?.pageTargetName
        ? `[Page] ${allEntries.find(entry => entry.pageTargetId === targetId)?.pageTargetName}`
        : null)
    : null;

  const sortOrder = searchParams.get("sort") === "asc" ? "asc" : "desc";
  const searchQuery = searchParams.get("q") ?? "";
  const dateFrom = searchParams.get("from") ?? "";
  const dateTo = searchParams.get("to") ?? "";
  const typesParam = searchParams.get("types") ?? "";
  // useMemo로 typesParam 문자열이 그대로면 배열 참조도 유지합니다 — 아래 entries의
  // useMemo가 매 렌더링마다(다른 값이 안 바뀌어도) 새로 계산되는 걸 막기 위함입니다.
  const activeTypes = useMemo(
    () => typesParam.split(",").filter(type => TYPE_LABELS[type]),
    [typesParam],
  );
  const typeFilters = {
    css: activeTypes.includes("css"),
    html: activeTypes.includes("html"),
    js: activeTypes.includes("js"),
  };

  const entries = useMemo(() => {
    let list =
      pendingHideIds.length > 0
        ? allEntries.filter(entry => !pendingHideIds.includes(entry.id))
        : allEntries;
    list = filterEntriesByTarget(list, targetId);

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter(entry =>
        [entry.title, entry.targetName, entry.author]
          .filter(Boolean)
          .some(field => field.toLowerCase().includes(query)),
      );
    }

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
  }, [allEntries, pendingHideIds, targetId, searchQuery, dateFrom, dateTo, sortOrder, activeTypes]);

  // 무한 스크롤: 필터링/정렬된 결과가 아무리 많아도 한 번에 PAGE_SIZE개만 렌더링하고,
  // 목록 아래쪽 sentinel이 보이면 더 불러옵니다. entries 자체가 바뀌면(필터/정렬/재조회)
  // 처음부터 다시 보여줘야 하므로 visibleCount를 초기값으로 되돌립니다.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const listRef = useRef(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [entries]);

  useEffect(() => {
    const root = listRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return undefined;

    const observer = new IntersectionObserver(
      ([sentinelEntry]) => {
        if (sentinelEntry.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, entries.length));
        }
      },
      { root, rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [entries.length]);

  const visibleEntries = entries.slice(0, visibleCount);

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
  const hasAnyFilter = Boolean(targetId) || hasDateFilter || hasTypeFilter || Boolean(searchQuery.trim());
  const clearAllFilters = () =>
    updateParams({ target: null, q: null, from: null, to: null, types: null });
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
      ? allEntries.find(entry => entry.id === selectedIds[0])?.targetId
      : null;

  const toggleSelect = id => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(existing => existing !== id);
      if (prev.length >= 2) return prev;
      if (prev.length === 1) {
        const firstTargetId = allEntries.find(entry => entry.id === prev[0])?.targetId;
        const nextTargetId = allEntries.find(entry => entry.id === id)?.targetId;
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
          value={searchQuery}
          onChange={e => updateParams({ q: e.target.value })}
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

      {pendingHideIds.length > 0 && (
        <div className={styles.undoToastWrap}>
          <div className={styles.undoToast}>
            <span className={styles.undoToastText}>
              이력 {pendingHideIds.length}개를 삭제했습니다
            </span>
            <button
              type="button"
              className={styles.undoToastAction}
              onClick={handleUndoHide}
            >
              실행 취소
            </button>
          </div>
        </div>
      )}

      <div className={styles.listSection}>
        <div className={styles.listHeader}>
          {hasProject && !error && !loading && hasAnyFilter && (
            <span className={styles.resultCount}>{entries.length}건</span>
          )}
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
            <span className={styles.sortLabel}>
              {sortOrder === "desc" ? "최신순" : "오래된순"}
            </span>
          </button>
        </div>

        {!loading && !hasProject && (
          <div className={styles.stateMessage}>
            <span>연결된 프로젝트가 없습니다. 먼저 프로젝트를 연결해 주세요.</span>
            <button
              type="button"
              className={styles.stateRetry}
              onClick={() => navigate("/connect")}
            >
              프로젝트 연결하기
            </button>
          </div>
        )}

        {hasProject && error && (
          <div className={styles.stateMessage}>
            <span>{error}</span>
            <button type="button" className={styles.stateRetry} onClick={reload}>
              다시 시도
            </button>
          </div>
        )}

        {hasProject && !error && loading && (
          <p className={styles.stateMessage}>이력을 불러오는 중...</p>
        )}

        {hasProject && !error && !loading && entries.length === 0 && (
          <div className={styles.stateMessage}>
            {hasAnyFilter ? (
              <>
                <span>조건에 맞는 이력이 없습니다.</span>
                <button type="button" className={styles.stateRetry} onClick={clearAllFilters}>
                  필터 초기화
                </button>
              </>
            ) : (
              <span>아직 저장된 이력이 없습니다.</span>
            )}
          </div>
        )}

        <div className={styles.list} ref={listRef}>
          {hasProject && !error && !loading && visibleEntries.map(item => (
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
              onHide={handleHide}
              isEditingTitle={editingTitleId === item.id}
              onTitleEditingChange={setEditingTitleId}
              isNew={newEntryIds.has(item.id)}
              isStarred={starredIds.has(item.id)}
              onToggleStar={toggleStar}
            />
          ))}
          {!loading && visibleCount < entries.length && (
            <div ref={sentinelRef} className={styles.scrollSentinel} />
          )}
        </div>
      </div>
    </div>
  );
}
