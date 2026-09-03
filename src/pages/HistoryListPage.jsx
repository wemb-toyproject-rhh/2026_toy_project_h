import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import mockHistory from "../mocks/mockHistory.json";
import PRCard from "../components/history/PRCard.jsx";
import HistoryFilterBar from "../components/history/HistoryFilterBar.jsx";
import Button from "../components/common/Button.jsx";
import {
  createDefaultFilters,
  getFilterScope,
  matchesHistoryFilters,
} from "../constants/historyFilterOptions.js";
import styles from "./HistoryListPage.module.css";

// 목록을 다시 불러오는 주기. 사이드바(SidebarFilter)와 같은 간격입니다.
const REFRESH_MS = 10_000;

// "2026-09-01T06:19:55.724Z" → "2026-09-01 06:19:55" (밀리초 제외)
function formatDate(value) {
  if (!value) return "-";
  return String(value).replace("T", " ").slice(0, 19);
}

/**
 * API 이력 항목을 카드에 넘길 형태로 바꿉니다.
 * 제목 형식:
 *   페이지   → [Page: 페이지명] id : 35
 *   컴포넌트 → [2D: 컴포넌트명] id : 87
 */
function toCard(item) {
  const prefix = `[${item.label}: ${item.name}]`;

  return {
    // 상세 페이지 주소용. 페이지/인스턴스는 hist_id 체계가 달라서 종류를 함께 넘깁니다.
    id: `${item.kind}-${item.histId}`,
    title: `${prefix} id : ${item.histId}`,
    // 페이지는 tb_user 와 조인한 실제 이름, 컴포넌트는 해당 컬럼이 없어 "-" 입니다.
    author: item.author || "-",
    savedAt: formatDate(item.savedAt),
    comment: item.comment,
    changes: item.changes.map((change) => ({
      type: change.type,
      label: change.lifecycle ? `${change.type} · ${change.lifecycle}` : change.type,
    })),
  };
}

export default function HistoryListPage() {
  const { selected } = useOutletContext();
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [failed, setFailed] = useState(false);
  const [checkedIds, setCheckedIds] = useState([]);
  const [notice, setNotice] = useState("");
  const [filters, setFilters] = useState(createDefaultFilters);
  const [sortOrder, setSortOrder] = useState("desc"); // desc: 최신순, asc: 오래된순
  const scope = useMemo(() => getFilterScope(selected), [selected]);

  // 사이드바/알림 벨과 같은 주기로 다시 불러옵니다. 그전엔 마운트 시 한 번만
  // 불러오고 끝이라, 새 이력이 생겨도 화면에 반영되지 않는 문제가 있었습니다.
  useEffect(() => {
    let cancelled = false;

    const load = () => {
      fetch("/api/history")
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((json) => {
          if (cancelled) return;
          setItems(json.items);
          setFailed(false);
        })
        .catch((err) => {
          if (cancelled) return;
          console.warn("[HistoryListPage] API 실패 → 샘플 데이터 사용:", err.message);
          setItems(null);
          setFailed(true);
        });
    };

    load();

    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, REFRESH_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // 사이드바 선택 + 검색 조건(날짜/구분/라이프사이클/이름)으로 걸러내고, 저장일 기준으로 정렬합니다.
  const cards = useMemo(() => {
    if (!items) return null;
    const bySidebar =
      selected.kind === "all"
        ? items
        : items.filter((item) => item.targetId === selected.targetId);
    const filtered = bySidebar.filter((item) => matchesHistoryFilters(item, filters));
    const sorted = [...filtered].sort((a, b) => {
      const cmp = String(a.savedAt ?? "").localeCompare(String(b.savedAt ?? ""));
      return sortOrder === "desc" ? -cmp : cmp;
    });
    return sorted.map(toCard);
  }, [items, selected, filters, sortOrder]);

  // 사이드바에서 타겟을 바꾸면 선택을 비우고, 타겟별로 옵션이 다른
  // 구분/라이프사이클 조건도 초기화합니다(날짜·이름 조건은 유지).
  useEffect(() => {
    setCheckedIds([]);
    setNotice("");
    setFilters((prev) => ({ ...prev, type: "all", lifecycle: "all" }));
  }, [selected.targetId, selected.kind]);

  const toggleCheck = (id) => {
    setNotice("");
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  };

  const goCompare = () => {
    if (checkedIds.length !== 2) return;

    // 서로 다른 타겟끼리는 비교할 스크립트 구성이 달라 비교가 불가능합니다.
    const picked = checkedIds
      .map((id) => items?.find((item) => `${item.kind}-${item.histId}` === id))
      .filter(Boolean);

    if (picked.length === 2 && picked[0].targetId !== picked[1].targetId) {
      setNotice("같은 타겟(페이지 또는 컴포넌트)의 이력 2개를 선택해 주세요.");
      return;
    }

    // 버전 A = hist_id 가 작은 쪽, 버전 B = 큰 쪽
    const [a, b] = [...picked].sort((x, y) => x.histId - y.histId);
    navigate(`/compare?a=${a.kind}-${a.histId}&b=${b.kind}-${b.histId}`);
  };

  // 카드 id 는 "page-38" / "instance-97" 형태입니다.
  const saveComment = async (cardId, comment) => {
    const at = cardId.indexOf("-");
    const kind = cardId.slice(0, at);
    const histId = cardId.slice(at + 1);

    const res = await fetch(`/api/history/${kind}/${histId}/comment`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);

    // 목록을 다시 부르지 않고 해당 항목만 갱신합니다.
    setItems((prev) =>
      prev?.map((entry) =>
        entry.kind === kind && String(entry.histId) === histId
          ? { ...entry, comment: json.comment }
          : entry,
      ) ?? prev,
    );
  };

  // 카드 id 는 "page-38" / "instance-97" 형태입니다.
  const deleteItem = async (cardId) => {
    const at = cardId.indexOf("-");
    const kind = cardId.slice(0, at);
    const histId = cardId.slice(at + 1);

    const res = await fetch(`/api/history/${kind}/${histId}`, { method: "DELETE" });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error ?? `HTTP ${res.status}`);
    }

    setItems((prev) =>
      prev?.filter((entry) => !(entry.kind === kind && String(entry.histId) === histId)) ?? prev,
    );
    setCheckedIds((prev) => prev.filter((id) => id !== cardId));
  };

  const heading =
    selected.kind === "all"
      ? "전체 이력"
      : `${selected.kind === "page" ? "[Page" : `[${selected.category}`}: ${selected.name}]`;

  return (
    <div className={styles.page}>
      <HistoryFilterBar
        scope={scope}
        value={filters}
        onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
      />

      {notice && <p className={styles.notice}>{notice}</p>}

      <div className={styles.subheading}>
        <div className={styles.subheadingLeft}>
          {heading}
          {cards && <span className={styles.countBadge}>{cards.length}건</span>}
        </div>
        <div className={styles.subheadingRight}>
          <div className={styles.sortControl}>
            <button type="button" className={styles.sortToggle} aria-label="정렬">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m3 8 4-4 4 4" />
                <path d="M7 4v16" />
                <path d="m21 16-4 4-4-4" />
                <path d="M17 20V4" />
              </svg>
            </button>
            <div className={styles.sortMenu}>
              <button
                type="button"
                className={`${styles.sortOption} ${sortOrder === "desc" ? styles.sortOptionActive : ""}`}
                onClick={() => setSortOrder("desc")}
              >
                최신순
              </button>
              <button
                type="button"
                className={`${styles.sortOption} ${sortOrder === "asc" ? styles.sortOptionActive : ""}`}
                onClick={() => setSortOrder("asc")}
              >
                오래된순
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.list}>
        {/* API 실패 시 샘플 데이터는 '전체 이력'일 때만 보여줍니다.
            특정 타겟을 고른 상태에서 무관한 샘플이 섞이지 않도록 합니다. */}
        {failed && selected.kind === "all" && (
          <>
            <p className={styles.empty}>
              API 서버에 연결하지 못해 샘플 데이터를 표시합니다 (npm run server)
            </p>
            {mockHistory.history.map((item) => (
              <PRCard key={item.id} item={item} />
            ))}
          </>
        )}

        {failed && selected.kind !== "all" && (
          <p className={styles.empty}>
            API 서버에 연결하지 못했습니다. 터미널에서 npm run server 를 실행해 주세요.
          </p>
        )}

        {cards?.length === 0 && (
          <p className={styles.empty}>검색 조건에 맞는 이력이 없습니다.</p>
        )}

        {cards?.map((card) => {
          const checked = checkedIds.includes(card.id);
          return (
            <PRCard
              key={card.id}
              item={card}
              checked={checked}
              checkboxDisabled={!checked && checkedIds.length >= 2}
              onToggle={toggleCheck}
              onSaveComment={saveComment}
              onDelete={deleteItem}
            />
          );
        })}
      </div>

      {checkedIds.length > 0 && (
        <div className={styles.selectionBar}>
          <span className={styles.selectionText}>
            {checkedIds.length}개 선택됨 · 비교하려면 2개를 선택하세요
          </span>
          <Button
            variant="primary"
            size="md"
            onClick={goCompare}
            disabled={checkedIds.length !== 2}
          >
            Diff 비교 ({checkedIds.length}/2)
          </Button>
          <button
            type="button"
            className={styles.selectionClose}
            aria-label="선택 취소"
            onClick={() => setCheckedIds([])}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
