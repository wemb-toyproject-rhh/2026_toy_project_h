import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { filterEntriesByTarget, getEntryById, getTabContent } from "../services/historyAdapter.js";
import { useHistory } from "../context/HistoryContext.jsx";
import { computeDiff } from "../utils/diff.js";
import Badge from "../components/common/Badge.jsx";
import BackLink from "../components/common/BackLink.jsx";
import ScrollToTopButton from "../components/common/ScrollToTopButton.jsx";
import DiffStatBadge from "../components/common/DiffStatBadge.jsx";
import SubTabGroup from "../components/detail/SubTabGroup.jsx";
import SideBySideDiff from "../components/compare/SideBySideDiff.jsx";
import styles from "./CompareHistoryPage.module.css";

function formatVersionMeta(entry) {
  return `${entry.savedAt}${entry.version ? ` · v${entry.version}` : ""}`;
}

export default function CompareHistoryPage() {
  const { state } = useLocation();
  const { entries, loading, error, reload } = useHistory();
  const [idA, setIdA] = useState(state?.ids?.[0] ?? null);
  const [idB, setIdB] = useState(state?.ids?.[1] ?? null);
  const entryA = getEntryById(entries, idA);
  const entryB = getEntryById(entries, idB);
  const bothLoaded = Boolean(entryA && entryB);

  // The right pane always shows the more recently saved entry, so the diff
  // (deletions on the left, additions on the right) reads chronologically
  // left-to-right regardless of the order the two entries were selected in.
  const isAOlder = bothLoaded && new Date(entryA.savedAtRaw) <= new Date(entryB.savedAtRaw);
  const olderVersion = bothLoaded ? (isAOlder ? entryA : entryB) : null;
  const newerVersion = bothLoaded ? (isAOlder ? entryB : entryA) : null;
  const setOlderId = isAOlder ? setIdA : setIdB;
  const setNewerId = isAOlder ? setIdB : setIdA;

  // A version can only be swapped for another history entry of the same
  // page/component, and never for whatever the other side is already
  // showing — comparing an entry against itself isn't a useful diff.
  const olderOptions = bothLoaded
    ? filterEntriesByTarget(entries, olderVersion.targetId).filter(
        (entry) => entry.id !== olderVersion.id && entry.id !== newerVersion.id,
      )
    : [];
  const newerOptions = bothLoaded
    ? filterEntriesByTarget(entries, newerVersion.targetId).filter(
        (entry) => entry.id !== newerVersion.id && entry.id !== olderVersion.id,
      )
    : [];

  const [activePrimaryId, setActivePrimaryId] = useState(null);
  const [activeSubId, setActiveSubId] = useState(null);

  // olderVersion arrives asynchronously (fetched from the API), so the
  // default tab is picked once here rather than as a useState initializer.
  useEffect(() => {
    if (!olderVersion || activePrimaryId) return;
    setActivePrimaryId(
      olderVersion.primaryTabs.find((tab) => tab.hasSubTabs)?.id ?? olderVersion.primaryTabs[0]?.id,
    );
    setActiveSubId(olderVersion.lifecycles.find((lc) => lc.modified)?.id ?? olderVersion.lifecycles[0]?.id);
  }, [olderVersion, activePrimaryId]);

  const codeOld = useMemo(
    () => (olderVersion ? getTabContent(olderVersion, activePrimaryId, activeSubId) : ""),
    [olderVersion, activePrimaryId, activeSubId],
  );
  const codeNew = useMemo(
    () => (newerVersion ? getTabContent(newerVersion, activePrimaryId, activeSubId) : ""),
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

  if (loading && entries.length === 0) {
    return (
      <div className={styles.page}>
        <BackLink />
        <p className={styles.stateMessage}>이력을 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <BackLink />
        <div className={styles.stateMessage}>
          <span>{error}</span>
          <button type="button" className={styles.stateRetry} onClick={reload}>
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!idA || !idB) {
    return (
      <div className={styles.page}>
        <BackLink />
        <p className={styles.stateMessage}>
          이력 리스트에서 비교할 이력 2개를 선택해주세요.
        </p>
      </div>
    );
  }

  if (!bothLoaded || !activePrimaryId) {
    return (
      <div className={styles.page}>
        <BackLink />
        <p className={styles.stateMessage}>비교할 이력을 찾을 수 없습니다.</p>
      </div>
    );
  }

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
