import { useMemo, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { buildTargetTree, getEntryById } from "../../services/historyAdapter.js";
import { useHistory } from "../../context/HistoryContext.jsx";
import Icon from "../common/Icon.jsx";
import DbStatus from "../common/DbStatus.jsx";
import styles from "./SidebarFilter.module.css";

export default function SidebarFilter() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { id } = useParams();
  const { entries } = useHistory();
  const [collapsedIds, setCollapsedIds] = useState(new Set());

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

  const toggleCollapsed = pageId => {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(pageId)) next.delete(pageId);
      else next.add(pageId);
      return next;
    });
  };

  return (
    <aside className={styles.sidebar}>
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
    </aside>
  );
}
