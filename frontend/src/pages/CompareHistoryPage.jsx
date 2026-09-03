import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { filterEntriesByTarget, getEntryById, getTabContent } from "../mocks/historyAdapter.js";
import { computeDiff } from "../utils/diff.js";
import Badge from "../components/common/Badge.jsx";
import BackLink from "../components/common/BackLink.jsx";
import ScrollToTopButton from "../components/common/ScrollToTopButton.jsx";
import DiffStatBadge from "../components/common/DiffStatBadge.jsx";
import SubTabGroup from "../components/detail/SubTabGroup.jsx";
import SideBySideDiff from "../components/compare/SideBySideDiff.jsx";
import styles from "./CompareHistoryPage.module.css";

const DEFAULT_IDS = ["page-28", "page-29"];

function formatVersionMeta(entry) {
  return `${entry.savedAt}${entry.version ? ` · v${entry.version}` : ""}`;
}

export default function CompareHistoryPage() {
  const { state } = useLocation();
  const [idA, setIdA] = useState(state?.ids?.[0] ?? DEFAULT_IDS[0]);
  const [idB, setIdB] = useState(state?.ids?.[1] ?? DEFAULT_IDS[1]);
  const entryA = getEntryById(idA) ?? getEntryById(DEFAULT_IDS[0]);
  const entryB = getEntryById(idB) ?? getEntryById(DEFAULT_IDS[1]);

  // The right pane always shows the more recently saved entry, so the diff
  // (deletions on the left, additions on the right) reads chronologically
  // left-to-right regardless of the order the two entries were selected in.
  const isAOlder = new Date(entryA.savedAtRaw) <= new Date(entryB.savedAtRaw);
  const olderVersion = isAOlder ? entryA : entryB;
  const newerVersion = isAOlder ? entryB : entryA;
  const setOlderId = isAOlder ? setIdA : setIdB;
  const setNewerId = isAOlder ? setIdB : setIdA;

  // A version can only be swapped for another history entry of the same
  // page/component, and never for whatever the other side is already
  // showing — comparing an entry against itself isn't a useful diff.
  const olderOptions = filterEntriesByTarget(olderVersion.targetId).filter(
    (entry) => entry.id !== olderVersion.id && entry.id !== newerVersion.id,
  );
  const newerOptions = filterEntriesByTarget(newerVersion.targetId).filter(
    (entry) => entry.id !== newerVersion.id && entry.id !== olderVersion.id,
  );

  const [activePrimaryId, setActivePrimaryId] = useState(
    olderVersion.primaryTabs.find((tab) => tab.hasSubTabs)?.id ?? olderVersion.primaryTabs[0]?.id,
  );
  const [activeSubId, setActiveSubId] = useState(
    olderVersion.lifecycles.find((lc) => lc.modified)?.id ?? olderVersion.lifecycles[0]?.id,
  );

  const codeOld = useMemo(
    () => getTabContent(olderVersion, activePrimaryId, activeSubId),
    [olderVersion, activePrimaryId, activeSubId],
  );
  const codeNew = useMemo(
    () => getTabContent(newerVersion, activePrimaryId, activeSubId),
    [newerVersion, activePrimaryId, activeSubId],
  );
  const { left, right } = useMemo(() => computeDiff(codeOld, codeNew), [codeOld, codeNew]);

  const diffStats = useMemo(
    () => ({
      additions: right.filter((line) => line.type === "add").length,
      deletions: left.filter((line) => line.type === "del").length,
    }),
    [left, right],
  );

  return (
    <div className={styles.page}>
      <BackLink />

      <div className={styles.header}>
        <Badge tone="accent">{olderVersion.targetLabel}</Badge>
      </div>

      <SubTabGroup
        primaryTabs={olderVersion.primaryTabs}
        lifecycles={olderVersion.lifecycles}
        activePrimaryId={activePrimaryId}
        activeSubId={activeSubId}
        onPrimaryChange={setActivePrimaryId}
        onSubChange={setActiveSubId}
        legendText="버전 간 달라진 스크립트"
        diffBadge={
          <DiffStatBadge additions={diffStats.additions} deletions={diffStats.deletions} />
        }
      />

      <SideBySideDiff
        left={{
          kind: "이전 버전",
          label: olderVersion.title,
          meta: formatVersionMeta(olderVersion),
          lines: left,
          code: codeOld,
          options: olderOptions,
          onSelect: setOlderId,
        }}
        right={{
          kind: "최신 버전",
          label: newerVersion.title,
          meta: formatVersionMeta(newerVersion),
          lines: right,
          code: codeNew,
          options: newerOptions,
          onSelect: setNewerId,
        }}
      />

      <ScrollToTopButton />
    </div>
  );
}
