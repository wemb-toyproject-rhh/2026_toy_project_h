// Pure helpers over the entry view-model returned by the real API
// (see services/historyApi.js) — every function here takes the current
// entries array as a parameter rather than owning the data itself.
const ICON_BY_KIND = { page: "page", "2D": "component2d", "3D": "component3d" };
const TYPE_LABEL_BY_KIND = { page: "Page", "2D": "2D", "3D": "3D" };

export function getEntryById(entries, id) {
  return entries.find((entry) => entry.id === id) ?? null;
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
export function buildTargetTree(entries) {
  const pages = new Map();
  const childrenByPage = new Map();

  entries.forEach((entry) => {
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
    all: { id: "all", icon: "all", label: "전체 이력 보기", count: entries.length },
    pages: [...pages.values()].map((page) => ({
      ...page,
      children: [...(childrenByPage.get(page.id)?.values() ?? [])],
    })),
  };
}

export function filterEntriesByTarget(entries, targetId) {
  if (!targetId || targetId === "all") return entries;
  return entries.filter((entry) => entry.targetId === targetId);
}
