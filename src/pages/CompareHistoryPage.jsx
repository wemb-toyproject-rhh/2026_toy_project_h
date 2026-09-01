import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { getEntryById, getTabContent } from "../mocks/historyAdapter.js";
import { computeDiff } from "../utils/diff.js";
import BackLink from "../components/common/BackLink.jsx";
import VersionSelectBar from "../components/compare/VersionSelectBar.jsx";
import SubTabGroup from "../components/detail/SubTabGroup.jsx";
import SideBySideDiff from "../components/compare/SideBySideDiff.jsx";
import styles from "./CompareHistoryPage.module.css";

const DEFAULT_IDS = ["page-28", "page-29"];

export default function CompareHistoryPage() {
  const { state } = useLocation();
  const [idA, idB] = state?.ids ?? DEFAULT_IDS;
  const versionA = getEntryById(idA) ?? getEntryById(DEFAULT_IDS[0]);
  const versionB = getEntryById(idB) ?? getEntryById(DEFAULT_IDS[1]);

  const [activePrimaryId, setActivePrimaryId] = useState(
    versionA.primaryTabs.find((tab) => tab.hasSubTabs)?.id ?? versionA.primaryTabs[0]?.id,
  );
  const [activeSubId, setActiveSubId] = useState(
    versionA.lifecycles.find((lc) => lc.modified)?.id ?? versionA.lifecycles[0]?.id,
  );

  const { left, right } = useMemo(() => {
    const codeA = getTabContent(versionA, activePrimaryId, activeSubId);
    const codeB = getTabContent(versionB, activePrimaryId, activeSubId);
    return computeDiff(codeA, codeB);
  }, [versionA, versionB, activePrimaryId, activeSubId]);

  return (
    <div className={styles.page}>
      <BackLink />

      <VersionSelectBar versionA={versionA} versionB={versionB} />

      <SubTabGroup
        primaryTabs={versionA.primaryTabs}
        lifecycles={versionA.lifecycles}
        activePrimaryId={activePrimaryId}
        activeSubId={activeSubId}
        onPrimaryChange={setActivePrimaryId}
        onSubChange={setActiveSubId}
      />

      <SideBySideDiff
        left={{ label: `버전 A · ${versionA.targetLabel}`, lines: left }}
        right={{ label: `버전 B · ${versionB.targetLabel}`, lines: right }}
      />
    </div>
  );
}
