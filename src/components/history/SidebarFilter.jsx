import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import mockHistory from "../../mocks/mockHistory.json";
import styles from "./SidebarFilter.module.css";

// 목록을 다시 불러오는 주기(밀리초). 값을 바꾸면 갱신 간격이 바뀝니다.
const REFRESH_MS = 10_000;

// API가 없을 때 쓰는 대체 데이터를 트리 형태로 맞춰둡니다.
const FALLBACK = {
  totalCount: mockHistory.targets[0]?.count ?? 0,
  pages: mockHistory.targets.slice(1).map((target) => ({
    pageId: target.id,
    name: target.label,
    histCount: target.count,
    instances: [],
  })),
};

export default function SidebarFilter({ selected, onSelect }) {
  const navigate = useNavigate();
  const [data, setData] = useState(FALLBACK);
  const [expanded, setExpanded] = useState({}); // 기본값: 모두 접힘
  const [source, setSource] = useState("loading"); // loading | db | mock
  const [updatedAt, setUpdatedAt] = useState(null);
  const aliveRef = useRef(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/targets");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!aliveRef.current) return;
      setData(json);
      setSource("db");
      setUpdatedAt(new Date());
    } catch (err) {
      if (!aliveRef.current) return;
      // API 서버가 꺼져 있거나 DB 접속이 안 되면 기존 샘플 데이터로 대체합니다.
      console.warn("[SidebarFilter] API 실패 → 샘플 데이터 사용:", err.message);
      setData(FALLBACK);
      setSource("mock");
    }
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    load();

    // 주기적으로 다시 불러옵니다. 다른 탭을 보고 있을 때는 건너뜁니다.
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, REFRESH_MS);

    // 탭으로 돌아오면 곧바로 한 번 갱신합니다.
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      aliveRef.current = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  // 접기/펼치기는 맨 앞 세모를 눌렀을 때만 동작합니다(행 클릭은 선택만).
  const toggleExpand = (event, page) => {
    event.stopPropagation();
    setExpanded((prev) => ({ ...prev, [page.pageId]: !prev[page.pageId] }));
  };

  // 상세 화면에 있을 때 사이드바를 누르면 이력 리스트로 돌아갑니다.
  const select = (target) => {
    onSelect(target);
    navigate("/");
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.list}>
        {/* 전체 이력 보기 */}
        <div
          className={[
            styles.item,
            selected.kind === "all" ? styles.active : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => select({ kind: "all" })}
        >
          <span className={styles.itemLabel}>
            <span className={styles.caretSpacer} />
            <span className={styles.icon}>◆</span>
            전체 이력
          </span>
          <span className={styles.count}>{data.totalCount}</span>
        </div>

        {/* 페이지 → 인스턴스 트리 */}
        {data.pages.map((page) => {
          const isOpen = !!expanded[page.pageId];
          const pageTargetId = `page-${page.pageId}`;

          return (
            <div key={page.pageId}>
              <div
                className={[
                  styles.item,
                  selected.targetId === pageTargetId ? styles.active : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() =>
                  select({
                    kind: "page",
                    targetId: pageTargetId,
                    name: page.name,
                  })
                }
                title={page.name}
              >
                <span className={styles.itemLabel}>
                  <span
                    className={`${styles.caret} ${isOpen ? styles.caretOpen : ""}`}
                    onClick={(event) => toggleExpand(event, page)}
                  >
                    {page.instances.length > 0 ? "▶" : ""}
                  </span>
                  <span className={styles.icon}>📄</span>
                  <span className={styles.name}>[Page] {page.name}</span>
                </span>
                <span className={styles.count}>{page.histCount}</span>
              </div>

              {isOpen &&
                page.instances.map((inst) => {
                  const instTargetId = `inst-${page.pageId}-${inst.name}`;

                  return (
                    <div
                      key={instTargetId}
                      className={[
                        styles.item,
                        styles.child,
                        selected.targetId === instTargetId ? styles.active : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() =>
                        select({
                          kind: "instance",
                          targetId: instTargetId,
                          name: inst.name,
                          category: inst.category,
                        })
                      }
                      title={inst.name}
                    >
                      <span className={styles.itemLabel}>
                        <span className={styles.icon}>
                          {inst.category === "3D" ? "🧊" : "🧩"}
                        </span>
                        <span className={styles.name}>
                          [{inst.category}] {inst.name}
                        </span>
                      </span>
                      <span className={styles.count}>{inst.histCount}</span>
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>

      <div className={styles.hint}>
        <div className={styles.statusRow}>
          {source === "loading" && <span>목록을 불러오는 중...</span>}
          {source === "db" && (
            <span className={styles.ok}>
              ● DB 연결됨
              {updatedAt && ` · ${updatedAt.toTimeString().slice(0, 8)} 갱신`}
            </span>
          )}
          {source === "mock" && (
            <span className={styles.warn}>
              ● API 서버에 연결하지 못해 샘플 데이터를 표시합니다 (npm run server)
            </span>
          )}
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={load}
            title={`${REFRESH_MS / 1000}초마다 자동 갱신 · 눌러서 지금 갱신`}
          >
            ⟳
          </button>
        </div>
        특정 페이지를 선택하면 해당 타겟이 수정된 이력만 필터링되어 표시됩니다.
      </div>
    </aside>
  );
}
