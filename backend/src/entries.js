// tb_page_hist / tb_instance_hist 원본 행을, 프론트(frontend/src/mocks/historyAdapter.js)가
// 목데이터로 만들어내던 것과 같은 모양의 "entry" 로 가공합니다.
// 나중에 그쪽 mock 함수를 이 API 호출로 바꿀 때 모양이 같아야 손댈 게 적습니다.
import { query } from "./db.js";
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
function buildPageEntry(row, prev) {
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
    title: row.comment || `${row.name} 저장`,
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

function buildInstanceEntry(row, prev) {
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
    targetLabel: `[${is3D ? "3D" : "2D"}] ${row.comp_name}`,
    targetName: row.comp_name,
    title: row.comment || `${row.comp_name} 저장`,
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

async function fetchPageRows() {
  const { rows } = await query(`
    SELECT p.hist_id, p.page_id, p.name, p.version,
           COALESCE(u.name, p.last_user) AS author,
           to_char(p.update_dt, 'YYYY-MM-DD HH24:MI:SS') AS saved_at,
           p.comment, p.css_code, p.lc_before_load, p.lc_loaded, p.lc_before_unload
    FROM tb_page_hist p
    LEFT JOIN tb_user u ON u.user_id = p.last_user
    ORDER BY p.page_id, p.hist_id ASC
  `);
  return rows;
}

async function fetchInstanceRows() {
  const { rows } = await query(`
    SELECT hist_id, inst_id, page_id, name, category, comp_name,
           to_char(reg_dt, 'YYYY-MM-DD HH24:MI:SS') AS saved_at,
           comment, css_code, html_code,
           lc_register, lc_completed, lc_before_destroy, lc_destroy, lc_preview
    FROM tb_instance_hist
    ORDER BY inst_id, hist_id ASC
  `);
  return rows;
}

// 전체 이력을 최신순으로 반환합니다. GET /api/history 가 그대로 씁니다.
export async function getAllEntries() {
  const [pageRows, instanceRows] = await Promise.all([fetchPageRows(), fetchInstanceRows()]);

  const entries = [];
  for (const rows of groupByTarget(pageRows, "page_id").values()) {
    rows.forEach((row, index) => entries.push(buildPageEntry(row, rows[index - 1] ?? null)));
  }
  for (const rows of groupByTarget(instanceRows, "inst_id").values()) {
    rows.forEach((row, index) => entries.push(buildInstanceEntry(row, rows[index - 1] ?? null)));
  }

  entries.sort((a, b) => new Date(b.savedAtRaw) - new Date(a.savedAtRaw));
  return entries;
}

// id 는 "page-39" / "inst-101" 형태입니다.
export async function getEntryById(id) {
  const entries = await getAllEntries();
  return entries.find((e) => e.id === id) ?? null;
}
