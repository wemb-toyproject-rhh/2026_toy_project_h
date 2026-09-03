// Adapts raw tb_page_hist / tb_instance_hist rows into the view-model the
// UI actually consumes. This is the one place that should change once a
// real API replaces the mock tables below.
import tbPageHist from "./db/tbPageHist.js";
import tbInstanceHist from "./db/tbInstanceHist.js";
import { computeDiff } from "../utils/diff.js";

const ICON_BY_KIND = { page: "page", "2D": "component2d", "3D": "component3d" };
const TYPE_LABEL_BY_KIND = { page: "Page", "2D": "2D", "3D": "3D" };

const PAGE_LIFECYCLES = [
  { id: "beforeLoad", label: "beforeLoad", field: "lc_before_load" },
  { id: "loaded", label: "loaded", field: "lc_loaded" },
  { id: "beforeUnLoad", label: "beforeUnLoad", field: "lc_before_unload" },
];

const TWO_D_LIFECYCLES = [
  { id: "register", label: "register", field: "lc_register" },
  { id: "completed", label: "completed", field: "lc_complete" },
  { id: "beforeDestroy", label: "beforeDestroy", field: "lc_before_destroy" },
  { id: "destroy", label: "destroy", field: "lc_destroy" },
  { id: "preview", label: "preview", field: "lc_preview" },
];

const THREE_D_LIFECYCLES = [
  { id: "register", label: "register", field: "lc_register" },
  { id: "beforeDestroy", label: "beforeDestroy", field: "lc_before_destroy" },
  { id: "destroy", label: "destroy", field: "lc_destroy" },
];

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function groupByTarget(rows, targetKey) {
  const map = new Map();
  rows.forEach((row) => {
    const key = row[targetKey];
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  });
  return map;
}

function buildChangedPaths(primaryTabs, lifecycles) {
  const paths = [];
  primaryTabs.forEach((tab) => {
    if (!tab.hasSubTabs && tab.modified) paths.push(tab.label);
  });
  lifecycles
    .filter((lc) => lc.modified)
    .forEach((lc) => paths.push(`JS · ${lc.label}`));
  return paths;
}

// Total added/removed line counts across every diffable field of an entry
// (CSS, HTML, and each lifecycle script) — used for the list page's +N -M
// stat badge, which summarizes the whole entry rather than a single tab.
function countDiffStats(pairs) {
  let additions = 0;
  let deletions = 0;

  pairs.forEach(([prev, current]) => {
    computeDiff(prev, current).unified.forEach((line) => {
      if (line.type === "add") additions += 1;
      else if (line.type === "del") deletions += 1;
    });
  });

  return { additions, deletions };
}

function buildLifecycles(row, prevRow, lifecycleDefs) {
  return lifecycleDefs.map((lc) => {
    const content = row[lc.field] ?? "";
    const prevContent = prevRow?.[lc.field] ?? "";
    return {
      id: lc.id,
      label: lc.label,
      content,
      prevContent,
      modified: content !== prevContent,
    };
  });
}

function buildPageEntries() {
  const entries = [];
  const groups = groupByTarget(tbPageHist, "page_id");

  for (const rows of groups.values()) {
    const sorted = [...rows].sort((a, b) => a.hist_id - b.hist_id);
    sorted.forEach((row, index) => {
      const prev = sorted[index - 1] ?? null;
      const lifecycles = buildLifecycles(row, prev, PAGE_LIFECYCLES);
      const cssCode = row.css_code ?? "";
      const prevCssCode = prev?.css_code ?? "";
      const primaryTabs = [
        {
          id: "css",
          label: "CSS",
          hasSubTabs: false,
          modified: cssCode !== prevCssCode,
        },
        {
          id: "js",
          label: "JAVASCRIPT",
          hasSubTabs: true,
          modified: lifecycles.some((lc) => lc.modified),
        },
      ];

      const diffStats = countDiffStats([
        [prevCssCode, cssCode],
        ...lifecycles.map((lc) => [lc.prevContent, lc.content]),
      ]);

      entries.push({
        id: `page-${row.hist_id}`,
        histId: row.hist_id,
        kind: "page",
        targetId: row.page_id,
        targetLabel: `[Page] ${row.name}`,
        targetName: row.name,
        title: row.comment || `${row.name} 저장`,
        author: row.last_user ?? null,
        version: row.version ?? null,
        savedAt: formatDate(row.reg_dt),
        savedAtRaw: row.reg_dt,
        comment: row.comment ?? "",
        primaryTabs,
        lifecycles,
        cssCode,
        prevCssCode,
        htmlCode: "",
        prevHtmlCode: "",
        changedPaths: buildChangedPaths(primaryTabs, lifecycles),
        additions: diffStats.additions,
        deletions: diffStats.deletions,
      });
    });
  }
  return entries;
}

function buildInstanceEntries() {
  const entries = [];
  const groups = groupByTarget(tbInstanceHist, "inst_id");

  for (const rows of groups.values()) {
    const sorted = [...rows].sort((a, b) => a.hist_id - b.hist_id);
    sorted.forEach((row, index) => {
      const prev = sorted[index - 1] ?? null;
      const is3D = row.category === "3D";
      const lifecycleDefs = is3D ? THREE_D_LIFECYCLES : TWO_D_LIFECYCLES;
      const lifecycles = buildLifecycles(row, prev, lifecycleDefs);
      const cssCode = row.css_code ?? "";
      const prevCssCode = prev?.css_code ?? "";
      const htmlCode = row.html_code ?? "";
      const prevHtmlCode = prev?.html_code ?? "";

      const primaryTabs = is3D
        ? [
            {
              id: "js",
              label: "JAVASCRIPT",
              hasSubTabs: true,
              modified: lifecycles.some((lc) => lc.modified),
            },
          ]
        : [
            { id: "html", label: "HTML", hasSubTabs: false, modified: htmlCode !== prevHtmlCode },
            { id: "css", label: "CSS", hasSubTabs: false, modified: cssCode !== prevCssCode },
            {
              id: "js",
              label: "JAVASCRIPT",
              hasSubTabs: true,
              modified: lifecycles.some((lc) => lc.modified),
            },
          ];

      const diffStats = countDiffStats([
        [prevHtmlCode, htmlCode],
        [prevCssCode, cssCode],
        ...lifecycles.map((lc) => [lc.prevContent, lc.content]),
      ]);

      entries.push({
        id: `inst-${row.hist_id}`,
        histId: row.hist_id,
        kind: row.category,
        targetId: row.inst_id,
        pageTargetId: row.page_id ?? null,
        targetLabel: `[${is3D ? "3D" : "2D"}] ${row.comp_name}`,
        targetName: row.comp_name,
        title: row.comment || `${row.comp_name} 저장`,
        author: null, // tb_instance_hist has no last_user column
        version: null, // tb_instance_hist has no version column
        savedAt: formatDate(row.reg_dt),
        savedAtRaw: row.reg_dt,
        comment: row.comment ?? "",
        primaryTabs,
        lifecycles,
        cssCode,
        prevCssCode,
        htmlCode,
        prevHtmlCode,
        changedPaths: buildChangedPaths(primaryTabs, lifecycles),
        additions: diffStats.additions,
        deletions: diffStats.deletions,
      });
    });
  }
  return entries;
}

export const historyEntries = [...buildPageEntries(), ...buildInstanceEntries()].sort(
  (a, b) => new Date(b.savedAtRaw) - new Date(a.savedAtRaw),
);

export function getEntryById(id) {
  return historyEntries.find((entry) => entry.id === id) ?? null;
}

// Mock stand-in for PUT /api/history/:id/metadata — mutates the shared
// entry in place so the new title is visible from list/detail/compare
// alike for the rest of the session.
export function updateEntryTitle(id, title) {
  const entry = getEntryById(id);
  if (entry) entry.title = title;
}

export function getTabContent(entry, primaryId, subId) {
  if (!entry) return "";
  if (primaryId === "css") return entry.cssCode ?? "";
  if (primaryId === "html") return entry.htmlCode ?? "";
  return entry.lifecycles.find((lc) => lc.id === subId)?.content ?? "";
}

export function getPrevTabContent(entry, primaryId, subId) {
  if (!entry) return "";
  if (primaryId === "css") return entry.prevCssCode ?? "";
  if (primaryId === "html") return entry.prevHtmlCode ?? "";
  return entry.lifecycles.find((lc) => lc.id === subId)?.prevContent ?? "";
}

// Sidebar tree: pages at the top level, their components (2D/3D instances)
// nested underneath — matches how RENOBIT actually contains components
// inside a page.
export function buildTargetTree() {
  const pages = new Map();
  const childrenByPage = new Map();

  historyEntries.forEach((entry) => {
    if (entry.kind === "page") {
      if (!pages.has(entry.targetId)) {
        pages.set(entry.targetId, {
          id: entry.targetId,
          icon: ICON_BY_KIND.page,
          typeLabel: TYPE_LABEL_BY_KIND.page,
          label: entry.targetName,
          count: 0,
        });
      }
      pages.get(entry.targetId).count += 1;
      return;
    }

    const pageId = entry.pageTargetId;
    if (!childrenByPage.has(pageId)) childrenByPage.set(pageId, new Map());
    const bucket = childrenByPage.get(pageId);
    if (!bucket.has(entry.targetId)) {
      bucket.set(entry.targetId, {
        id: entry.targetId,
        icon: ICON_BY_KIND[entry.kind] ?? "•",
        typeLabel: TYPE_LABEL_BY_KIND[entry.kind] ?? entry.kind,
        label: entry.targetName,
        count: 0,
      });
    }
    bucket.get(entry.targetId).count += 1;
  });

  return {
    all: { id: "all", icon: "all", label: "전체 이력 보기", count: historyEntries.length },
    pages: [...pages.values()].map((page) => ({
      ...page,
      children: [...(childrenByPage.get(page.id)?.values() ?? [])],
    })),
  };
}

export function filterEntriesByTarget(targetId) {
  if (!targetId || targetId === "all") return historyEntries;
  return historyEntries.filter((entry) => entry.targetId === targetId);
}
