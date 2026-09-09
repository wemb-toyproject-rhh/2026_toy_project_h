import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { buildTargetTree, getEntryById } from "../../services/historyAdapter.js";
import { useHistory } from "../../context/HistoryContext.jsx";
import { useProjects } from "../../context/ProjectContext.jsx";
import Icon from "../common/Icon.jsx";
import DbStatus from "../common/DbStatus.jsx";
import styles from "./SidebarFilter.module.css";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "rhh_sidebar_collapsed";

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

  // 프로젝트를 바꾸면(=새로운 트리 컨텍스트) 이전에 접어뒀더라도 일단 펼친
  // 상태로 보여줍니다 — 같은 프로젝트 안에서 페이지를 이동하는 것과는 다르게,
  // 새 프로젝트의 전체 구조를 한 번은 보고 시작하는 게 자연스럽습니다.
  const lastProjectIdRef = useRef(undefined);
  useEffect(() => {
    const projectId = currentProject?.id;
    if (projectId === undefined) return;
    if (lastProjectIdRef.current !== undefined && lastProjectIdRef.current !== projectId) {
      setSidebarCollapsed(false);
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
      className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ""}`}
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
            <DbStatus />
            <p className={styles.hint}>
              페이지나 컴포넌트를 선택하면 해당 타겟의 이력만 <br></br> 필터링되어
              표시됩니다.
            </p>
          </div>
        </>
      )}
    </aside>
  );
}
