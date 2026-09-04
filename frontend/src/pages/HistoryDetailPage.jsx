import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getEntryById, getPrevTabContent, getTabContent } from "../services/historyAdapter.js";
import { useHistory } from "../context/HistoryContext.jsx";
import { computeDiff } from "../utils/diff.js";
import Badge from "../components/common/Badge.jsx";
import BackLink from "../components/common/BackLink.jsx";
import EditableTitle from "../components/common/EditableTitle.jsx";
import DiffStatBadge from "../components/common/DiffStatBadge.jsx";
import CopyButton from "../components/common/CopyButton.jsx";
import ScrollToTopButton from "../components/common/ScrollToTopButton.jsx";
import ConversationPanel from "../components/detail/ConversationPanel.jsx";
import SubTabGroup from "../components/detail/SubTabGroup.jsx";
import DiffBlock from "../components/common/DiffBlock.jsx";
import styles from "./HistoryDetailPage.module.css";

export default function HistoryDetailPage() {
  const { id } = useParams();
  const { entries, loading, error, reload, updateTitle } = useHistory();
  const entry = getEntryById(entries, id);

  const [activePrimaryId, setActivePrimaryId] = useState(null);
  const [activeSubId, setActiveSubId] = useState(null);

  // entry arrives asynchronously (fetched from the API), so the default tab
  // is picked once here rather than as a useState initializer.
  useEffect(() => {
    if (!entry || activePrimaryId) return;
    setActivePrimaryId(entry.primaryTabs.find((tab) => tab.hasSubTabs)?.id ?? entry.primaryTabs[0]?.id);
    setActiveSubId(entry.lifecycles.find((lc) => lc.modified)?.id ?? entry.lifecycles[0]?.id);
  }, [entry, activePrimaryId]);

  const diffLines = useMemo(() => {
    if (!entry || !activePrimaryId) return [];
    const current = getTabContent(entry, activePrimaryId, activeSubId);
    const prev = getPrevTabContent(entry, activePrimaryId, activeSubId);
    return computeDiff(prev, current).unified;
  }, [entry, activePrimaryId, activeSubId]);

  const diffStats = useMemo(() => {
    let additions = 0;
    let deletions = 0;
    diffLines.forEach((line) => {
      if (line.type === "add") additions += 1;
      else if (line.type === "del") deletions += 1;
    });
    return { additions, deletions };
  }, [diffLines]);

  if (loading && !entry) {
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

  if (!entry) {
    return (
      <div className={styles.page}>
        <BackLink />
        <p className={styles.stateMessage}>이력을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const note = {
    summary: entry.comment || "작성된 설명이 없습니다.",
    raw: entry.comment ?? "",
  };

  const activePrimaryTab = entry.primaryTabs.find((tab) => tab.id === activePrimaryId);
  const activeCopyLabel = activePrimaryTab?.hasSubTabs
    ? entry.lifecycles.find((lc) => lc.id === activeSubId)?.label ?? activePrimaryTab.label
    : activePrimaryTab?.label ?? "";

  return (
    <div className={styles.page}>
      <BackLink />

      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <Badge tone="accent">{entry.targetLabel}</Badge>
          <EditableTitle
            value={entry.title}
            className={styles.title}
            onSave={(newTitle) => updateTitle(entry.id, newTitle)}
          />
        </div>
        <div className={styles.headerRight}>
          <span className={styles.meta}>
            {entry.author ? `${entry.author} · ` : ""}
            {entry.savedAt}
            {entry.version ? ` · v${entry.version}` : ""}
          </span>
          <CopyButton
            text={getTabContent(entry, activePrimaryId, activeSubId)}
            label={`${activeCopyLabel} 코드 복사`}
          />
        </div>
      </div>

      <ConversationPanel note={note} />

      <SubTabGroup
        targetLabel={entry.targetLabel}
        primaryTabs={entry.primaryTabs}
        lifecycles={entry.lifecycles}
        activePrimaryId={activePrimaryId}
        activeSubId={activeSubId}
        onPrimaryChange={setActivePrimaryId}
        onSubChange={setActiveSubId}
        diffBadge={
          <DiffStatBadge additions={diffStats.additions} deletions={diffStats.deletions} />
        }
      />

      <DiffBlock lines={diffLines} />

      <ScrollToTopButton />
    </div>
  );
}
