import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { buildTargetTree, getEntryById } from "../../services/historyAdapter.js";
import { useHistory } from "../../context/HistoryContext.jsx";
import { useProjects } from "../../context/ProjectContext.jsx";
import Icon from "../common/Icon.jsx";
import DbStatus from "../common/DbStatus.jsx";
import styles from "./SidebarFilter.module.css";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "rhh_sidebar_collapsed";
const SIDEBAR_WIDTH_STORAGE_KEY = "rhh_sidebar_width";
const SIDEBAR_DEFAULT_WIDTH = 300;
const SIDEBAR_MIN_WIDTH = 220;
const SIDEBAR_MAX_WIDTH = 480;

export default function SidebarFilter() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { id } = useParams();
  const { entries } = useHistory();
  const { currentProject } = useProjects();
  const [collapsedIds, setCollapsedIds] = useState(new Set());
  // Diff 비교처럼 가로 공간이 아쉬운 화면을 위해 사이드바 자체를 접을 수 있게
  // 하고, 그 상태는 페이지를 이동해도(새로고침해도) 유지되도록 기억해둡니다.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, sidebarCollapsed ? "1" : "0");
    } catch {
      // localStorage를 쓸 수 없는 환경(프라이빗 모드 등)이면 그냥 이번 세션에서만 기억합니다.
    }
  }, [sidebarCollapsed]);

  // 사이드바 너비 — 핸들로 드래그해서 조절할 수 있고, 그 값은 기억해둡니다.
  // --sidebar-width는 헤더 로고 영역, 리스트/휴지통의 플로팅 버튼 위치 등
  // 이 컴포넌트 바깥의 여러 곳에서도 같이 참조하는 전역 토큰이라, 컴포넌트
  // 스코프의 인라인 스타일이 아니라 documentElement에 직접 반영합니다.
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const stored = Number(localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY));
      if (stored >= SIDEBAR_MIN_WIDTH && stored <= SIDEBAR_MAX_WIDTH) return stored;
    } catch {
      // ignore
    }
    return SIDEBAR_DEFAULT_WIDTH;
  });
  useLayoutEffect(() => {
    document.documentElement.style.setProperty("--sidebar-width", `${sidebarWidth}px`);
    try {
      localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(sidebarWidth));
    } catch {
      // localStorage를 쓸 수 없는 환경이면 이번 세션에서만 기억합니다.
    }
  }, [sidebarWidth]);

  // 드래그 중엔 sidebar의 width 트랜지션(접기/펼치기 애니메이션용)을 꺼서, 너비가
  // 마우스를 따라오다 뒤늦게 도착하는 느낌 없이 1:1로 반응하게 합니다.
  const [isResizing, setIsResizing] = useState(false);

  const handleResizeStart = (e) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMove = (moveEvent) => {
      const next = Math.min(
        SIDEBAR_MAX_WIDTH,
        Math.max(SIDEBAR_MIN_WIDTH, startWidth + (moveEvent.clientX - startX)),
      );
      setSidebarWidth(next);
    };
    const handleUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  };

  // 프로젝트를 바꾸면(=새로운 트리 컨텍스트) 사이드바 자체는 다시 펼쳐서 보여줍니다
  // — 같은 프로젝트 안에서 페이지를 이동하는 것과는 다르게, 새 프로젝트로 왔다는
  // 걸 놓치지 않게요. 트리 각 페이지 노드의 펼침/접힘 상태(collapsedIds)는 아래
  // 별도 effect가 다시 기본값(전부 접힘)으로 계산합니다.
  const lastProjectIdRef = useRef(undefined);
  const collapseInitRef = useRef(false);
  useEffect(() => {
    const projectId = currentProject?.id;
    if (projectId === undefined) return;
    if (lastProjectIdRef.current !== undefined && lastProjectIdRef.current !== projectId) {
      setSidebarCollapsed(false);
      collapseInitRef.current = false;
    }
    lastProjectIdRef.current = projectId;
  }, [currentProject?.id]);

  // Detail/compare pages don't carry a "target" query param of their own —
  // derive the sidebar's active target from whatever entry is actually being
  // viewed there, so it doesn't fall back to "전체 이력 보기" while looking
  // at one specific page/component.
  const activeTarget = useMemo(() => {
    if (location.pathname.startsWith("/history/") && id) {
      return getEntryById(entries, id)?.targetId ?? "all";
    }
    if (location.pathname === "/compare") {
      const compareId = location.state?.ids?.[0];
      return (compareId && getEntryById(entries, compareId)?.targetId) ?? "all";
    }
    return searchParams.get("target") ?? "all";
  }, [location.pathname, location.state, id, searchParams, entries]);

  const { all, pages } = buildTargetTree(entries);
  const groupIdsWithChildren = pages
    .filter(page => page.children.length > 0)
    .map(page => page.id);

  // 하위 항목이 있는 페이지는 기본적으로 접힌 채로 시작합니다. entries가 비동기로
  // 로딩되므로, 트리 구조를 실제로 알 수 있게 된 첫 시점(또는 프로젝트를 바꿔서
  // 다시 로딩된 시점)에 한 번만 적용합니다 — 그 뒤로는 사용자가 직접 펼치고/접는
  // 조작만 반영합니다.
  useEffect(() => {
    if (collapseInitRef.current || groupIdsWithChildren.length === 0) return;
    collapseInitRef.current = true;
    setCollapsedIds(new Set(groupIdsWithChildren));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupIdsWithChildren.join(",")]);

  const toggleCollapsed = pageId => {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(pageId)) next.delete(pageId);
      else next.add(pageId);
      return next;
    });
  };

  const expandAll = () => setCollapsedIds(new Set());
  const collapseAll = () => setCollapsedIds(new Set(groupIdsWithChildren));
  const allCollapsed =
    groupIdsWithChildren.length > 0 &&
    groupIdsWithChildren.every(pageId => collapsedIds.has(pageId));

  return (
    <aside
      className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ""} ${isResizing ? styles.resizing : ""}`}
      onClick={sidebarCollapsed ? () => setSidebarCollapsed(false) : undefined}
    >
      <button
        type="button"
        className={styles.collapseToggle}
        onClick={() => setSidebarCollapsed(v => !v)}
        aria-label={sidebarCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
        title={sidebarCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
      >
        <Icon
          name="chevron"
          size={12}
          className={sidebarCollapsed ? styles.collapseIconCollapsed : styles.collapseIconExpanded}
        />
      </button>

      {!sidebarCollapsed && (
        <div
          className={styles.resizeHandle}
          onMouseDown={handleResizeStart}
          role="separator"
          aria-orientation="vertical"
          aria-label="사이드바 너비 조절"
          title="드래그해서 너비 조절"
        />
      )}

      {!sidebarCollapsed && (
        <>
          {groupIdsWithChildren.length > 0 && (
            <div className={styles.treeControls}>
              <button
                type="button"
                className={styles.treeControlBtn}
                onClick={allCollapsed ? expandAll : collapseAll}
                aria-label={allCollapsed ? "트리 전체 펼치기" : "트리 전체 접기"}
                title={allCollapsed ? "전체 펼치기" : "전체 접기"}
              >
                <Icon name={allCollapsed ? "expandAll" : "collapseAll"} size={13} />
              </button>
            </div>
          )}

          <div className={styles.list}>
            <div className={styles.pageRow}>
              <span className={styles.toggleSpacer} />
              <Link
                to="/"
                className={`${styles.item} ${styles.pageLink} ${activeTarget === "all" ? styles.active : ""}`}
                title={all.label}
              >
                <span className={styles.itemLabel}>
                  <span className={styles.labelText}>{all.label}</span>
                </span>
                <span className={styles.count}>{all.count}</span>
              </Link>
            </div>

            {pages.map(page => {
              const hasChildren = page.children.length > 0;
              const collapsed = collapsedIds.has(page.id);

              return (
                <div key={page.id} className={styles.pageGroup}>
                  <div className={styles.pageRow}>
                    {hasChildren ? (
                      <button
                        type="button"
                        className={`${styles.toggle} ${collapsed ? "" : styles.toggleExpanded}`}
                        aria-label={
                          collapsed ? "하위 항목 펼치기" : "하위 항목 접기"
                        }
                        aria-expanded={!collapsed}
                        onClick={() => toggleCollapsed(page.id)}
                      >
                        <Icon name="chevron" size={11} />
                      </button>
                    ) : (
                      <span className={styles.toggleSpacer} />
                    )}
                    <Link
                      to={`/?target=${encodeURIComponent(page.id)}`}
                      className={`${styles.item} ${styles.pageLink} ${activeTarget === page.id ? styles.active : ""}`}
                      title={page.label}
                    >
                      <span className={styles.itemLabel}>
                        <span className={styles.typeTag}>{page.typeLabel}</span>
                        <span className={styles.labelText}>{page.label}</span>
                      </span>
                      <span className={styles.count}>{page.count}</span>
                    </Link>
                  </div>

                  {hasChildren &&
                    !collapsed &&
                    page.children.map(child => (
                      <Link
                        key={child.id}
                        to={`/?target=${encodeURIComponent(child.id)}`}
                        className={`${styles.item} ${styles.childItem} ${activeTarget === child.id ? styles.active : ""}`}
                        title={child.label}
                      >
                        <span className={styles.itemLabel}>
                          <span className={styles.treeBranch} />
                          <span className={styles.typeTag}>{child.typeLabel}</span>
                          <span className={styles.labelText}>{child.label}</span>
                        </span>
                        <span className={styles.count}>{child.count}</span>
                      </Link>
                    ))}
                </div>
              );
            })}
          </div>

          <div className={styles.footer}>
            <Link to="/trash" className={`${styles.item} ${styles.trashItem}`}>
              <span className={styles.itemLabel}>
                <Icon name="trash" size={13} />
                <span className={styles.labelText}>휴지통</span>
              </span>
            </Link>
            <DbStatus />
          </div>
        </>
      )}
    </aside>
  );
}
