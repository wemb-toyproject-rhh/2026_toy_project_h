// 사이드바에서 고른 타겟(페이지 / 2D 컴포넌트 / 3D 컴포넌트)에 따라
// 검색 조건의 "구분", "라이프사이클" 콤보박스에 보여줄 값을 정의합니다.
// server/index.js 의 PAGE_SECTIONS / INSTANCE_SECTIONS 와 짝을 이룹니다.
const PAGE_LIFECYCLES = ["beforeLoad", "loaded", "beforeUnLoad"];
const LIFECYCLES_2D = ["register", "completed", "beforeDestroy", "destroy", "preview"];
const LIFECYCLES_3D = ["register", "beforeDestroy", "destroy"];

export const TYPE_LABELS = { CSS: "CSS", HTML: "HTML", JS: "JavaScript" };

// 필터 칩 / 변경 태그의 점 색상. 실제 필터링 조건에는 영향을 주지 않는 표시용 값입니다.
export const TYPE_COLORS = { CSS: "#4c6ef5", HTML: "#e8590c", JS: "#f59f00" };

/**
 * selected: AppLayout 에서 내려오는 사이드바 선택 상태
 *   { kind: "all" } | { kind: "page", ... } | { kind: "instance", category, ... }
 */
export function getFilterScope(selected) {
  if (selected.kind === "page") {
    return { types: ["CSS", "JS"], lifecycles: PAGE_LIFECYCLES };
  }
  if (selected.kind === "instance" && selected.category === "3D") {
    return { types: ["JS"], lifecycles: LIFECYCLES_3D };
  }
  if (selected.kind === "instance") {
    // 2D 컴포넌트 (카테고리 정보가 없는 경우도 2D 취급)
    return { types: ["CSS", "HTML", "JS"], lifecycles: LIFECYCLES_2D };
  }
  // 전체 이력 보기 — 세 종류를 합쳐서 보여줍니다.
  return {
    types: ["CSS", "HTML", "JS"],
    lifecycles: [...new Set([...PAGE_LIFECYCLES, ...LIFECYCLES_2D])],
  };
}

function toDateStr(date) {
  return date.toISOString().slice(0, 10);
}

export function createDefaultFilters() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 14);

  return {
    dateFrom: toDateStr(from),
    dateTo: toDateStr(to),
    type: "all",
    lifecycle: "all",
    name: "",
  };
}

// item: /api/history 의 원본 항목 (savedAt: "YYYY-MM-DD HH:MI:SS", changes: [{type, lifecycle}])
export function matchesHistoryFilters(item, filters) {
  const day = String(item.savedAt).slice(0, 10);
  if (filters.dateFrom && day < filters.dateFrom) return false;
  if (filters.dateTo && day > filters.dateTo) return false;

  if (filters.name.trim()) {
    const needle = filters.name.trim().toLowerCase();
    if (!item.name?.toLowerCase().includes(needle)) return false;
  }

  if (filters.type !== "all" || filters.lifecycle !== "all") {
    const hasMatch = (item.changes ?? []).some((change) => {
      if (filters.type !== "all" && change.type !== filters.type) return false;
      if (filters.lifecycle !== "all" && change.lifecycle !== filters.lifecycle) return false;
      return true;
    });
    if (!hasMatch) return false;
  }

  return true;
}
