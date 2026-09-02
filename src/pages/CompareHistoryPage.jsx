import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { filterEntriesByTarget, getEntryById, getTabContent } from "../mocks/historyAdapter.js";
import { computeDiff } from "../utils/diff.js";
import BackLink from "../components/common/BackLink.jsx";
import ScrollToTopButton from "../components/common/ScrollToTopButton.jsx";
import SubTabGroup from "../components/detail/SubTabGroup.jsx";
import SideBySideDiff from "../components/compare/SideBySideDiff.jsx";
import styles from "./CompareHistoryPage.module.css";

const DEFAULT_IDS = ["page-28", "page-29"];

export default function CompareHistoryPage() {
  const { state } = useLocation();
  const [idA, setIdA] = useState(state?.ids?.[0] ?? DEFAULT_IDS[0]);
  const [idB, setIdB] = useState(state?.ids?.[1] ?? DEFAULT_IDS[1]);
  const versionA = getEntryById(idA) ?? getEntryById(DEFAULT_IDS[0]);
  const versionB = getEntryById(idB) ?? getEntryById(DEFAULT_IDS[1]);

  // A version can only be swapped for another history entry of the same
  // page/component — comparing unrelated targets wouldn't make sense.
  const optionsA = filterEntriesByTarget(versionA.targetId).filter(
    (entry) => entry.id !== versionA.id,
  );
  const optionsB = filterEntriesByTarget(versionB.targetId).filter(
    (entry) => entry.id !== versionB.id,
  );

  const [activePrimaryId, setActivePrimaryId] = useState(
    versionA.primaryTabs.find((tab) => tab.hasSubTabs)?.id ?? versionA.primaryTabs[0]?.id,
  );
  const [activeSubId, setActiveSubId] = useState(
    versionA.lifecycles.find((lc) => lc.modified)?.id ?? versionA.lifecycles[0]?.id,
  );

  const codeA = useMemo(
    () => getTabContent(versionA, activePrimaryId, activeSubId),
    [versionA, activePrimaryId, activeSubId],
  );
  const codeB = useMemo(
    () => getTabContent(versionB, activePrimaryId, activeSubId),
    [versionB, activePrimaryId, activeSubId],
  );
  const { left, right } = useMemo(() => computeDiff(codeA, codeB), [codeA, codeB]);

  return (
    <div className={styles.page}>
      <BackLink />

      <SubTabGroup
        primaryTabs={versionA.primaryTabs}
        lifecycles={versionA.lifecycles}
        activePrimaryId={activePrimaryId}
        activeSubId={activeSubId}
        onPrimaryChange={setActivePrimaryId}
        onSubChange={setActiveSubId}
        legendText="버전 간 달라진 스크립트"
      />

      <SideBySideDiff
        left={{
          label: `버전 A · ${versionA.targetLabel}`,
          lines: left,
          code: codeA,
          options: optionsA,
          onSelect: setIdA,
        }}
        right={{
          label: `버전 B · ${versionB.targetLabel}`,
          lines: right,
          code: codeB,
          options: optionsB,
          onSelect: setIdB,
        }}
      />

      <ScrollToTopButton />
    </div>
  );
}
