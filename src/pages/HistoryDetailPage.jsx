import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CopyButton from "../components/common/CopyButton.jsx";
import ConversationPanel from "../components/detail/ConversationPanel.jsx";
import SubTabGroup from "../components/detail/SubTabGroup.jsx";
import DiffBlock from "../components/common/DiffBlock.jsx";
import { diffLines, countChanges } from "../utils/diff.js";
import styles from "./HistoryDetailPage.module.css";

function formatDate(value) {
  if (!value) return "-";
  return String(value).replace("T", " ").slice(0, 19);
}

export default function HistoryDetailPage() {
  // 주소는 /history/page-33, /history/instance-87 형태입니다.
  const { id = "" } = useParams();
  const separator = id.indexOf("-");
  const kind = separator === -1 ? "page" : id.slice(0, separator);
  const histId = separator === -1 ? id : id.slice(separator + 1);

  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  const [activeGroup, setActiveGroup] = useState("JAVASCRIPT");
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/history/${kind}/${histId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error ?? `HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        setDetail(json);
        setError("");
        // 진입 시 JAVASCRIPT 의 첫 번째 라이프사이클을 기본으로 엽니다.
        const first = json.sections.find((s) => s.group === "JAVASCRIPT");
        setActiveGroup("JAVASCRIPT");
        setActiveSection(first?.id ?? json.sections[0]?.id ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        setDetail(null);
        setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [kind, histId]);

  const primaryTabs = useMemo(() => {
    if (!detail) return [];
    const groups = [...new Set(detail.sections.map((s) => s.group))];
    return groups.map((group) => ({
      id: group,
      label: group,
      modified: detail.sections.some((s) => s.group === group && s.modified),
    }));
  }, [detail]);

  const lifecycles = useMemo(() => {
    if (!detail) return [];
    return detail.sections
      .filter((s) => s.group === activeGroup)
      .map((s) => ({ id: s.id, label: s.label, modified: s.modified }));
  }, [detail, activeGroup]);

  const section = detail?.sections.find((s) => s.id === activeSection);

  // 가장 최신 이력을 기준으로, 지금 보고 있는 이력이 어떻게 다른지 비교합니다.
  const lines = useMemo(
    () => (section ? diffLines(section.latest, section.current) : []),
    [section],
  );
  const counts = countChanges(lines);

  const changeGroup = (group) => {
    setActiveGroup(group);
    const first = detail?.sections.find((s) => s.group === group);
    setActiveSection(first?.id ?? null);
  };

  // 비고를 hist_id 기준으로 저장합니다.
  const saveComment = async (text) => {
    const res = await fetch(`/api/history/${kind}/${histId}/comment`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: text }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);

    setDetail((prev) =>
      prev ? { ...prev, current: { ...prev.current, comment: json.comment } } : prev,
    );
  };

  if (error) {
    return (
      <div className={styles.page}>
        <p className={styles.message}>
          이력을 불러오지 못했습니다 — {error}
          <br />
          API 서버가 실행 중인지 확인해 주세요 (npm run server).
        </p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className={styles.page}>
        <p className={styles.message}>불러오는 중...</p>
      </div>
    );
  }

  const title = `[${detail.label}: ${detail.name}] id : ${detail.current.histId}`;

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.backLink}>
        ← 이력 리스트
      </Link>

      <div className={styles.headerBlock}>
        <span className={styles.eyebrow}>이력 상세</span>

        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <strong className={styles.title}>{title}</strong>
          </div>
          {/* 왼쪽: 비교 기준이 되는 최신 원본 / 오른쪽: 지금 보고 있는 이력 */}
          <div className={styles.headerActions}>
            <CopyButton
              text={section?.latest}
              label="최신 원본 복사"
              hint={`최신 id : ${detail.latest.histId}`}
            />
            <CopyButton
              text={section?.current}
              label="전체 복사"
              hint={`이 이력 id : ${detail.current.histId}`}
            />
          </div>
        </div>
      </div>

      <div className={styles.metaRow}>
        작성자 {detail.current.author || "-"} · 저장 {formatDate(detail.current.savedAt)}
      </div>

      <ConversationPanel
        note={{
          summary: detail.current.comment || "이 이력에 등록된 비고가 없습니다.",
          raw: detail.current.comment || "",
        }}
        onSave={saveComment}
      />

      <SubTabGroup
        targetLabel={`[${detail.label}: ${detail.name}]`}
        primaryTabs={primaryTabs}
        lifecycles={lifecycles}
        activePrimary={activeGroup}
        onPrimaryChange={changeGroup}
        activeSub={activeSection}
        onSubChange={setActiveSection}
        legend="최신 이력과 다른 스크립트"
      />

      <div className={styles.compareBar}>
        <span>
          기준 <strong>최신 id : {detail.latest.histId}</strong>
          {"  →  "}
          비교 <strong>이 이력 id : {detail.current.histId}</strong>
        </span>
        {lines.length > 0 && (
          <span className={styles.counts}>
            <span className={styles.added}>+{counts.added}</span>
            <span className={styles.removed}>-{counts.removed}</span>
          </span>
        )}
      </div>

      {lines.length > 0 ? (
        <DiffBlock lines={lines} />
      ) : (
        <p className={styles.message}>
          {detail.isLatest
            ? "이 이력이 가장 최신입니다. 비교할 대상이 없습니다."
            : "최신 이력과 내용이 동일합니다."}
        </p>
      )}
    </div>
  );
}
