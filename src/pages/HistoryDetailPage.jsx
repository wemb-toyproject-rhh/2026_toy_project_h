import { useMemo, useReducer, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getEntryById,
  getPrevTabContent,
  getTabContent,
  updateEntryTitle,
} from "../mocks/historyAdapter.js";
import { computeDiff } from "../utils/diff.js";
import Badge from "../components/common/Badge.jsx";
import Button from "../components/common/Button.jsx";
import BackLink from "../components/common/BackLink.jsx";
import EditableTitle from "../components/common/EditableTitle.jsx";
import ConversationPanel from "../components/detail/ConversationPanel.jsx";
import SubTabGroup from "../components/detail/SubTabGroup.jsx";
import DiffBlock from "../components/common/DiffBlock.jsx";
import styles from "./HistoryDetailPage.module.css";

export default function HistoryDetailPage() {
  const { id } = useParams();
  const entry = getEntryById(id) ?? getEntryById("page-29");
  const [, forceRerender] = useReducer((n) => n + 1, 0);

  const [activePrimaryId, setActivePrimaryId] = useState(
    entry.primaryTabs.find((tab) => tab.hasSubTabs)?.id ?? entry.primaryTabs[0]?.id,
  );
  const [activeSubId, setActiveSubId] = useState(
    entry.lifecycles.find((lc) => lc.modified)?.id ?? entry.lifecycles[0]?.id,
  );

  const diffLines = useMemo(() => {
    const current = getTabContent(entry, activePrimaryId, activeSubId);
    const prev = getPrevTabContent(entry, activePrimaryId, activeSubId);
    return computeDiff(prev, current).unified;
  }, [entry, activePrimaryId, activeSubId]);

  const note = {
    summary: entry.comment || "작성된 설명이 없습니다.",
    raw: entry.comment ?? "",
  };

  return (
    <div className={styles.page}>
      <BackLink />

      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <Badge tone="accent">{entry.targetLabel}</Badge>
          <EditableTitle
            value={entry.title}
            className={styles.title}
            onSave={(newTitle) => {
              updateEntryTitle(entry.id, newTitle);
              forceRerender();
            }}
          />
        </div>
        <div className={styles.headerRight}>
          <span className={styles.meta}>
            {entry.author ? `${entry.author} · ` : ""}
            {entry.savedAt}
            {entry.version ? ` · v${entry.version}` : ""}
          </span>
          <Button variant="primary">전체 스크립트 복사</Button>
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
      />

      <DiffBlock lines={diffLines} />
    </div>
  );
}
