import { useEffect, useRef, useState } from "react";
import {
  TYPE_COLORS,
  TYPE_LABELS,
  createDefaultFilters,
} from "../../constants/historyFilterOptions.js";
import styles from "./HistoryFilterBar.module.css";

/**
 * scope: getFilterScope(selected) 결과 — { types, lifecycles }
 * value: 현재 필터 값, onChange(partial) 로 일부만 갱신합니다.
 * 필터링 조건(matchesHistoryFilters, getFilterScope)은 건드리지 않고
 * 검색창 + 드롭다운 형태로 표시만 바꾼 컴포넌트입니다.
 */
export default function HistoryFilterBar({ scope, value, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  const lifecycleDisabled = value.type === "CSS" || value.type === "HTML";
  const typeActive = value.type !== "all";
  const hasActiveFilter =
    typeActive || value.lifecycle !== "all" || value.name.trim() !== "";

  const setType = (type) => {
    // CSS/HTML 은 라이프사이클 개념이 없어서 함께 초기화합니다.
    onChange({ type, lifecycle: type === "CSS" || type === "HTML" ? "all" : value.lifecycle });
  };

  const toggleType = (type) => setType(value.type === type ? "all" : type);

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <div className={`${styles.searchBar} ${open ? styles.searchBarOpen : ""}`}>
        <button
          type="button"
          className={styles.filterToggle}
          onClick={() => setOpen((o) => !o)}
        >
          필터
          {hasActiveFilter && <span className={styles.activeDot} />}
          <span className={styles.chevron}>{open ? "⌃" : "⌄"}</span>
        </button>

        <span className={styles.divider} />
        <span className={styles.searchIcon}>🔍</span>
        <input
          type="text"
          className={styles.search}
          placeholder="이력 제목, 작성자, 스크립트 검색..."
        />
      </div>

      {open && (
        <div className={styles.panel}>
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionLabel}>변경 유형</span>
            </div>
            <div className={styles.chips}>
              {scope.types.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`${styles.chip} ${value.type === type ? styles.chipActive : ""}`}
                  style={{ "--chip-color": TYPE_COLORS[type] }}
                  onClick={() => toggleType(type)}
                >
                  <span className={styles.chipDot} />
                  {TYPE_LABELS[type]}
                </button>
              ))}
            </div>
            {typeActive && (
              <div className={styles.clearRow}>
                <button
                  type="button"
                  className={styles.clearLink}
                  onClick={() => setType("all")}
                >
                  유형 초기화
                </button>
              </div>
            )}
          </div>

          <div className={styles.divider2} />

          <div className={styles.section}>
            <span className={styles.sectionLabel}>기간</span>
            <div className={styles.dateRow}>
              <input
                type="date"
                className={styles.date}
                value={value.dateFrom}
                max={value.dateTo || undefined}
                onChange={(e) => onChange({ dateFrom: e.target.value })}
              />
              <span className={styles.tilde}>~</span>
              <input
                type="date"
                className={styles.date}
                value={value.dateTo}
                min={value.dateFrom || undefined}
                onChange={(e) => onChange({ dateTo: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.section}>
            <span className={styles.sectionLabel}>라이프사이클</span>
            <select
              className={styles.select}
              value={value.lifecycle}
              disabled={lifecycleDisabled}
              onChange={(e) => onChange({ lifecycle: e.target.value })}
            >
              <option value="all">전체</option>
              {scope.lifecycles.map((lc) => (
                <option key={lc} value={lc}>
                  {lc}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.section}>
            <span className={styles.sectionLabel}>페이지명</span>
            <input
              type="text"
              className={styles.nameInput}
              placeholder="페이지/컴포넌트명으로 검색"
              value={value.name}
              onChange={(e) => onChange({ name: e.target.value })}
            />
          </div>

          <div className={styles.panelFoot}>
            <button
              type="button"
              className={styles.resetAll}
              onClick={() => onChange(createDefaultFilters())}
            >
              전체 초기화
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
