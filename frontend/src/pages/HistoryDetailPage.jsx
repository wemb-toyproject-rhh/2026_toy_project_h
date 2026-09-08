import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  filterEntriesByTarget,
  getEntryById,
  getPrevTabContent,
  getTabContent,
} from "../services/historyAdapter.js";
import { useHistory } from "../context/HistoryContext.jsx";
import { useProjects } from "../context/ProjectContext.jsx";
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
  const navigate = useNavigate();
  const { entries, loading, error, reload, updateMetadata } = useHistory();
  const { currentProject } = useProjects();
  const entry = getEntryById(entries, id);

  // 이력 id는 프로젝트(대상 DB)별로 매겨지는 값이라, 이 화면을 보다가 다른
  // 프로젝트로 바꾸면 지금 id는 새 프로젝트에서 의미가 없어집니다(운 나쁘면
  // 우연히 같은 id의 완전히 다른 이력이 보일 수도 있음) — 진짜 전환이면
  // 이력전체보기로 보냅니다. 최초 로딩 시의 undefined → 실제 id 전환은 제외합니다.
  const lastProjectIdRef = useRef(undefined);
  useEffect(() => {
    const projectId = currentProject?.id;
    if (projectId === undefined) return;
    if (lastProjectIdRef.current !== undefined && lastProjectIdRef.current !== projectId) {
      navigate("/");
    }
    lastProjectIdRef.current = projectId;
  }, [currentProject?.id, navigate]);

  // 같은 타겟(페이지/컴포넌트)의 다른 버전들 사이를, 리스트로 돌아가지 않고 바로
  // 오갈 수 있게 저장 시각 순으로 정렬해둡니다.
  const siblings = useMemo(() => {
    if (!entry) return [];
    return [...filterEntriesByTarget(entries, entry.targetId)].sort(
      (a, b) => new Date(a.savedAtRaw) - new Date(b.savedAtRaw),
    );
  }, [entries, entry]);
  const siblingIndex = entry ? siblings.findIndex((sibling) => sibling.id === entry.id) : -1;
  const olderEntry = siblingIndex > 0 ? siblings[siblingIndex - 1] : null;
  const newerEntry =
    siblingIndex >= 0 && siblingIndex < siblings.length - 1 ? siblings[siblingIndex + 1] : null;

  const [activePrimaryId, setActivePrimaryId] = useState(null);
  const [activeSubId, setActiveSubId] = useState(null);

  // 이전/다음 이력 버튼으로 다른 버전으로 넘어가면 id만 바뀌고 이 컴포넌트는
  // 그대로 재사용되므로(리마운트 안 됨), 탭 선택을 초기화해서 아래 effect가
  // 새 버전 기준으로 다시 기본 탭을 고르게 합니다.
  useEffect(() => {
    setActivePrimaryId(null);
    setActiveSubId(null);
  }, [entry?.id]);

  // entry arrives asynchronously (fetched from the API), so the default tab
  // is picked once here rather than as a useState initializer.
  useEffect(() => {
    if (!entry || activePrimaryId) return;
    setActivePrimaryId(
      entry.primaryTabs.find((tab) => tab.modified)?.id
        ?? entry.primaryTabs.find((tab) => tab.hasSubTabs)?.id
        ?? entry.primaryTabs[0]?.id,
    );
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
      <div className={styles.topBar}>
        <BackLink />
        {siblings.length > 1 && (
          <div className={styles.historyNav}>
            <button
              type="button"
              className={styles.navBtn}
              disabled={!olderEntry}
              onClick={() => olderEntry && navigate(`/history/${olderEntry.id}`)}
            >
              ← 이전 이력
            </button>
            <span className={styles.navPosition}>
              {siblingIndex + 1} / {siblings.length}
            </span>
            <button
              type="button"
              className={styles.navBtn}
              disabled={!newerEntry}
              onClick={() => newerEntry && navigate(`/history/${newerEntry.id}`)}
            >
              다음 이력 →
            </button>
          </div>
        )}
      </div>

      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <Badge tone="accent">{entry.targetLabel}</Badge>
          <EditableTitle
            value={entry.title}
            className={styles.title}
            onSave={(newTitle) => updateMetadata(entry.id, { title: newTitle })}
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

      <ConversationPanel
        note={note}
        onSave={(newComment) => updateMetadata(entry.id, { comment: newComment })}
      />

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
