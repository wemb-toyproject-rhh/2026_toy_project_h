// tb_page_hist / tb_instance_hist 원본 행을, 프론트(frontend/src/mocks/historyAdapter.js)가
// 목데이터로 만들어내던 것과 같은 모양의 "entry" 로 가공합니다.
// 나중에 그쪽 mock 함수를 이 API 호출로 바꿀 때 모양이 같아야 손댈 게 적습니다.
//
// tb_page_hist / tb_instance_hist 는 RHH 자체 DB(db.js 의 고정 풀)가 아니라 사용자가
// 선택한 프로젝트가 가리키는 대상 DB에 있습니다. 그래서 이 파일의 함수들은 어떤 풀을 쓸지
// 호출하는 쪽(server.js)이 `query` 옵션으로 넘겨주고, 안 넘기면 기존 동작대로 RHH 고정
// 풀을 기본값으로 씁니다(테스트/단독 호출 시 편의를 위함).
import { query as defaultQuery } from "./db.js";
import { countLineDiff } from "./diff.js";

const PAGE_LIFECYCLES = [
  { id: "beforeLoad", label: "beforeLoad", column: "lc_before_load" },
  { id: "loaded", label: "loaded", column: "lc_loaded" },
  { id: "beforeUnLoad", label: "beforeUnLoad", column: "lc_before_unload" },
];

// register/completed/beforeDestroy/destroy/preview 5개가 실제 RENOBIT 2D 컴포넌트 에디터 탭과
// 일치합니다. DB에는 lc_complete 라는 컬럼도 있지만 항상 비어있어 쓰지 않습니다(직접 확인함).
const TWO_D_LIFECYCLES = [
  { id: "register", label: "register", column: "lc_register" },
  { id: "completed", label: "completed", column: "lc_completed" },
  { id: "beforeDestroy", label: "beforeDestroy", column: "lc_before_destroy" },
  { id: "destroy", label: "destroy", column: "lc_destroy" },
  { id: "preview", label: "preview", column: "lc_preview" },
];

const THREE_D_LIFECYCLES = [
  { id: "register", label: "register", column: "lc_register" },
  { id: "beforeDestroy", label: "beforeDestroy", column: "lc_before_destroy" },
  { id: "destroy", label: "destroy", column: "lc_destroy" },
];

// DB에서 이미 "YYYY-MM-DD HH24:MI:SS" 문자열로 받아오므로, new Date() 가 안정적으로
// 파싱하도록 가운데 공백만 "T" 로 바꿔줍니다.
function toIsoish(value) {
  return value ? String(value).replace(" ", "T") : "";
}

function groupByTarget(rows, key) {
  const map = new Map();
  for (const row of rows) {
    const k = row[key];
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(row);
  }
  return map;
}

function buildLifecycles(row, prevRow, defs) {
  return defs.map((lc) => {
    const content = row[lc.column] ?? "";
    const prevContent = prevRow?.[lc.column] ?? "";
    return { id: lc.id, label: lc.label, content, prevContent, modified: content !== prevContent };
  });
}

function sumDiff(pairs) {
  return pairs.reduce(
    (acc, [prev, current]) => {
      const { additions, deletions } = countLineDiff(prev, current);
      acc.additions += additions;
      acc.deletions += deletions;
      return acc;
    },
    { additions: 0, deletions: 0 },
  );
}

function buildChangedPaths(primaryTabs, lifecycles) {
  const paths = [];
  for (const tab of primaryTabs) {
    if (!tab.hasSubTabs && tab.modified) paths.push(tab.label);
  }
  for (const lc of lifecycles) {
    if (lc.modified) paths.push(`JS · ${lc.label}`);
  }
  return paths;
}

// prev: 같은 타겟의 바로 이전 이력(이번 저장 직전 상태). 항상 "최신"이 아니라
// "그 시점에 뭐가 바뀌었는지"를 보여주기 위해, 타겟별로 hist_id 오름차순 정렬 후
// 바로 앞 행을 prev 로 씁니다.
function buildPageEntry(row, prev, seq) {
  const lifecycles = buildLifecycles(row, prev, PAGE_LIFECYCLES);
  const cssCode = row.css_code ?? "";
  const prevCssCode = prev?.css_code ?? "";
  const primaryTabs = [
    { id: "css", label: "CSS", hasSubTabs: false, modified: cssCode !== prevCssCode },
    { id: "js", label: "JAVASCRIPT", hasSubTabs: true, modified: lifecycles.some((l) => l.modified) },
  ];
  const { additions, deletions } = sumDiff([
    [prevCssCode, cssCode],
    ...lifecycles.map((l) => [l.prevContent, l.content]),
  ]);

  return {
    id: `page-${row.hist_id}`,
    histId: Number(row.hist_id),
    kind: "page",
    targetId: row.page_id,
    targetLabel: `[Page] ${row.name}`,
    targetName: row.name,
    // seq 는 같은 타겟(page_id) 안에서 과거순으로 매긴 번호입니다(1부터 시작).
    // title 이 있으면 "#번호 제목", 없으면 "#번호"만 표시합니다.
    title: row.title ? `#${seq} ${row.title}` : `#${seq}`,
    hidden: row.hidden ?? false,
    author: row.author || null,
    version: row.version || null,
    savedAt: toIsoish(row.saved_at),
    savedAtRaw: toIsoish(row.saved_at),
    comment: row.comment ?? "",
    primaryTabs,
    lifecycles,
    cssCode,
    prevCssCode,
    htmlCode: "",
    prevHtmlCode: "",
    changedPaths: buildChangedPaths(primaryTabs, lifecycles),
    additions,
    deletions,
  };
}

function buildInstanceEntry(row, prev, seq) {
  const is3D = row.category === "3D";
  const defs = is3D ? THREE_D_LIFECYCLES : TWO_D_LIFECYCLES;
  const lifecycles = buildLifecycles(row, prev, defs);
  const cssCode = row.css_code ?? "";
  const prevCssCode = prev?.css_code ?? "";
  const htmlCode = row.html_code ?? "";
  const prevHtmlCode = prev?.html_code ?? "";

  const primaryTabs = is3D
    ? [{ id: "js", label: "JAVASCRIPT", hasSubTabs: true, modified: lifecycles.some((l) => l.modified) }]
    : [
        { id: "html", label: "HTML", hasSubTabs: false, modified: htmlCode !== prevHtmlCode },
        { id: "css", label: "CSS", hasSubTabs: false, modified: cssCode !== prevCssCode },
        {
          id: "js",
          label: "JAVASCRIPT",
          hasSubTabs: true,
          modified: lifecycles.some((l) => l.modified),
        },
      ];

  const { additions, deletions } = sumDiff([
    [prevHtmlCode, htmlCode],
    [prevCssCode, cssCode],
    ...lifecycles.map((l) => [l.prevContent, l.content]),
  ]);

  return {
    id: `inst-${row.hist_id}`,
    histId: Number(row.hist_id),
    kind: row.category,
    targetId: row.inst_id,
    pageTargetId: row.page_id ?? null,
    // 이 페이지 자체의 이력(tb_page_hist)이 없을 때, 프론트가 사이드바 트리에
    // 페이지 노드를 만들 때 쓸 이름입니다 (tb_page 조인 결과, 없으면 null).
    pageTargetName: row.page_name ?? null,
    // comp_name 이 아니라 name 이 화면에 표시할 인스턴스 이름입니다 (comp_name 은 다른 값).
    targetLabel: `[${is3D ? "3D" : "2D"}] ${row.name}`,
    targetName: row.name,
    // seq 는 같은 타겟(inst_id) 안에서 과거순으로 매긴 번호입니다(1부터 시작).
    // title 이 있으면 "#번호 제목", 없으면 "#번호"만 표시합니다.
    title: row.title ? `#${seq} ${row.title}` : `#${seq}`,
    hidden: row.hidden ?? false,
    author: null, // tb_instance_hist 에는 작성자 컬럼이 없음
    version: null, // tb_instance_hist 에는 버전 컬럼이 없음
    savedAt: toIsoish(row.saved_at),
    savedAtRaw: toIsoish(row.saved_at),
    comment: row.comment ?? "",
    primaryTabs,
    lifecycles,
    cssCode,
    prevCssCode,
    htmlCode,
    prevHtmlCode,
    changedPaths: buildChangedPaths(primaryTabs, lifecycles),
    additions,
    deletions,
  };
}

// 컬럼을 하나하나 나열하지 않고 테이블 전체(*)를 가져옵니다. 이렇게 하면
// title/hidden 처럼 나중에 컬럼이 추가돼도 SELECT 를 매번 고칠 필요가 없습니다.
// (buildPageEntry/buildInstanceEntry 가 실제로 쓰는 필드만 골라 응답에 담으므로,
// props 같은 무거운 컬럼이 딸려와도 API 응답 크기에는 영향이 없습니다.)
async function fetchPageRows(runQuery) {
  const { rows } = await runQuery(`
    SELECT p.*,
           COALESCE(u.name, p.last_user) AS author,
           to_char(p.update_dt, 'YYYY-MM-DD HH24:MI:SS') AS saved_at
    FROM tb_page_hist p
    LEFT JOIN tb_user u ON u.user_id = p.last_user
    ORDER BY p.page_id, p.hist_id ASC
  `);
  return rows;
}

// tb_page(현재 상태 테이블)를 조인해서 page_name 을 같이 내려줍니다 — 어떤 페이지가
// 한 번도 직접 저장된 적 없고(=tb_page_hist에 행이 없고) 그 안의 컴포넌트만 저장된
// 이력이 있으면, targetTree 를 만들 때 그 페이지 이름을 알 방법이 없기 때문입니다.
// (ih.* 로 명시적으로 별칭을 줘서, tb_page 의 name 컬럼이 인스턴스 자신의 name 을
// 덮어쓰지 않도록 합니다 — 두 테이블 다 name 컬럼이 있어서 실수하기 쉬운 지점입니다.)
async function fetchInstanceRows(runQuery) {
  const { rows } = await runQuery(`
    SELECT ih.*,
           pg.name AS page_name,
           to_char(ih.reg_dt, 'YYYY-MM-DD HH24:MI:SS') AS saved_at
    FROM tb_instance_hist ih
    LEFT JOIN tb_page pg ON pg.page_id = ih.page_id
    ORDER BY ih.inst_id, ih.hist_id ASC
  `);
  return rows;
}

// 전체 이력을 최신순으로 반환합니다. GET /api/history 가 그대로 씁니다.
// includeHidden 이 false(기본값)면 숨김 처리된 이력은 목록에서 빠집니다 —
// "전체 이력 보기" 화면은 숨긴 이력을 안 보여줘야 하기 때문입니다.
// query 는 어느 프로젝트(대상 DB)에서 조회할지를 결정합니다 (server.js 가 넘겨줌).
export async function getAllEntries({ includeHidden = false, query: runQuery = defaultQuery } = {}) {
  const [pageRows, instanceRows] = await Promise.all([
    fetchPageRows(runQuery),
    fetchInstanceRows(runQuery),
  ]);

  const entries = [];
  for (const rows of groupByTarget(pageRows, "page_id").values()) {
    rows.forEach((row, index) =>
      entries.push(buildPageEntry(row, rows[index - 1] ?? null, index + 1)),
    );
  }
  for (const rows of groupByTarget(instanceRows, "inst_id").values()) {
    rows.forEach((row, index) =>
      entries.push(buildInstanceEntry(row, rows[index - 1] ?? null, index + 1)),
    );
  }

  entries.sort((a, b) => new Date(b.savedAtRaw) - new Date(a.savedAtRaw));
  return includeHidden ? entries : entries.filter((entry) => !entry.hidden);
}

// id 는 "page-39" / "inst-101" 형태입니다.
// 단건 조회는 숨김 여부와 무관하게 항상 찾을 수 있어야 합니다 — 상세/비교 화면
// 접근, 그리고 숨김 처리 직후 "수정된 이력"을 응답으로 돌려주는 데도 쓰이기 때문입니다.
export async function getEntryById(id, { query: runQuery = defaultQuery } = {}) {
  const entries = await getAllEntries({ includeHidden: true, query: runQuery });
  return entries.find((e) => e.id === id) ?? null;
}
