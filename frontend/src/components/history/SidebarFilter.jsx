import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { buildTargetTree } from "../../mocks/historyAdapter.js";
import Icon from "../common/Icon.jsx";
import styles from "./SidebarFilter.module.css";

export default function SidebarFilter() {
  const [searchParams] = useSearchParams();
  const [collapsedIds, setCollapsedIds] = useState(new Set());
  const activeTarget = searchParams.get("target") ?? "all";
  const { all, pages } = buildTargetTree();

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
              <span className={styles.icon}>
                <Icon name={all.icon} />
              </span>
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
                    <span className={styles.icon}>
                      <Icon name={page.icon} />
                    </span>
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
                      <span className={styles.icon}>
                        <Icon name={child.icon} />
                      </span>
                      <span className={styles.labelText}>{child.label}</span>
                    </span>
                    <span className={styles.count}>{child.count}</span>
                  </Link>
                ))}
            </div>
          );
        })}
      </div>

      <p className={styles.hint}>
        페이지나 컴포넌트를 선택하면 해당 타겟의 이력만 <br></br> 필터링되어
        표시됩니다.
      </p>
    </aside>
  );
}
