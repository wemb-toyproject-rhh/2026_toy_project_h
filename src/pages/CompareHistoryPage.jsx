import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import VersionSelectBar from "../components/compare/VersionSelectBar.jsx";
import SubTabGroup from "../components/detail/SubTabGroup.jsx";
import SideBySideDiff from "../components/compare/SideBySideDiff.jsx";
import { diffLines, splitDiff, countChanges } from "../utils/diff.js";
import styles from "./CompareHistoryPage.module.css";

// "page-34" → { kind: "page", histId: 34 }
function parseRef(value) {
  if (!value) return null;
  const at = value.indexOf("-");
  if (at === -1) return null;
  return { kind: value.slice(0, at), histId: Number(value.slice(at + 1)) };
}

export default function CompareHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const refA = parseRef(searchParams.get("a"));
  const refB = parseRef(searchParams.get("b"));
  const kind = refA?.kind ?? refB?.kind ?? null;

  // 버전 A 는 hist_id 가 작은 쪽, 버전 B 는 큰 쪽으로 항상 정렬합니다.
  const [lo, hi] = useMemo(() => {
    const values = [refA?.histId, refB?.histId].filter(Number.isFinite);
    return values.length === 2 ? [...values].sort((x, y) => x - y) : [null, null];
  }, [refA?.histId, refB?.histId]);

  const [list, setList] = useState(null);
  const [detailA, setDetailA] = useState(null);
  const [detailB, setDetailB] = useState(null);
  const [error, setError] = useState("");
  const [activeGroup, setActiveGroup] = useState("JAVASCRIPT");
  const [activeSection, setActiveSection] = useState(null);

  // 드롭다운에 채울 같은 타겟의 이력 목록
  useEffect(() => {
    let cancelled = false;
    fetch("/api/history")
      .then((res) => res.json())
      .then((json) => !cancelled && setList(json.items))
      .catch(() => !cancelled && setList([]));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!kind || lo == null || hi == null) return;
    let cancelled = false;

    const load = (histId) =>
      fetch(`/api/history/${kind}/${histId}`).then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
        return json;
      });

    Promise.all([load(lo), load(hi)])
      .then(([a, b]) => {
        if (cancelled) return;
        setDetailA(a);
        setDetailB(b);
        setError("");
        const first = a.sections.find((s) => s.group === "JAVASCRIPT");
        setActiveGroup("JAVASCRIPT");
        setActiveSection(first?.id ?? a.sections[0]?.id ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        setDetailA(null);
        setDetailB(null);
        setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [kind, lo, hi]);

  const versions = useMemo(() => {
    if (!list || !kind || lo == null) return [];
    const anchor = list.find((i) => i.kind === kind && i.histId === lo);
    if (!anchor) return [];
    return list
      .filter((i) => i.targetId === anchor.targetId)
      .sort((x, y) => x.histId - y.histId);
  }, [list, kind, lo]);

  // 두 이력의 같은 구획끼리 비교합니다.
  const sections = useMemo(() => {
    if (!detailA || !detailB) return [];
    return detailA.sections.map((sectionA) => {
      const sectionB = detailB.sections.find((s) => s.id === sectionA.id);
      return {
        id: sectionA.id,
        group: sectionA.group,
        label: sectionA.label,
        a: sectionA.current ?? "",
        b: sectionB?.current ?? "",
        modified: (sectionA.current ?? "") !== (sectionB?.current ?? ""),
      };
    });
  }, [detailA, detailB]);

  const primaryTabs = useMemo(() => {
    const groups = [...new Set(sections.map((s) => s.group))];
    return groups.map((group) => ({
      id: group,
      label: group,
      modified: sections.some((s) => s.group === group && s.modified),
    }));
  }, [sections]);

  const lifecycles = sections
    .filter((s) => s.group === activeGroup)
    .map((s) => ({ id: s.id, label: s.label, modified: s.modified }));

  const section = sections.find((s) => s.id === activeSection);

  const panes = useMemo(() => {
    if (!section) return { left: [], right: [] };
    return splitDiff(diffLines(section.a, section.b));
  }, [section]);

  const counts = countChanges(panes.right.concat(panes.left));

  const applyVersions = (nextLo, nextHi) => {
    const [a, b] = [nextLo, nextHi].sort((x, y) => x - y);
    setSearchParams({ a: `${kind}-${a}`, b: `${kind}-${b}` });
  };

  const changeGroup = (group) => {
    setActiveGroup(group);
    setActiveSection(sections.find((s) => s.group === group)?.id ?? null);
  };

  if (!kind || lo == null || hi == null) {
    return (
      <div className={styles.page}>
        <p className={styles.message}>
          비교할 이력이 선택되지 않았습니다.
          <br />
          이력 리스트에서 체크박스로 <strong>2개</strong>를 고른 뒤 「선택한 2개 이력
          Diff 비교」 버튼을 눌러 주세요.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <p className={styles.message}>이력을 불러오지 못했습니다 — {error}</p>
      </div>
    );
  }

  if (!detailA || !detailB) {
    return (
      <div className={styles.page}>
        <p className={styles.message}>불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.backLink}>
        ← 이력 리스트
      </Link>

      <div className={styles.headerBlock}>
        <span className={styles.eyebrow}>버전 비교</span>

        <VersionSelectBar
          versions={versions}
          valueA={lo}
          valueB={hi}
          onChangeA={(value) => applyVersions(value, hi)}
          onChangeB={(value) => applyVersions(lo, value)}
          targetLabel={`[${detailA.label}: ${detailA.name}]`}
        />
      </div>

      <SubTabGroup
        targetLabel={`[${detailA.label}: ${detailA.name}]`}
        primaryTabs={primaryTabs}
        lifecycles={lifecycles}
        activePrimary={activeGroup}
        onPrimaryChange={changeGroup}
        activeSub={activeSection}
        onSubChange={setActiveSection}
        legend="두 버전이 다른 스크립트"
      />

      {section?.modified ? (
        <>
          <div className={styles.summary}>
            <span>
              버전 A <strong>id : {lo}</strong> → 버전 B <strong>id : {hi}</strong>
            </span>
            <span className={styles.counts}>
              <span className={styles.added}>+{counts.added}</span>
              <span className={styles.removed}>-{counts.removed}</span>
            </span>
          </div>

          <SideBySideDiff
            left={{ label: `버전 A · id : ${lo}`, lines: panes.left, source: section.a }}
            right={{ label: `버전 B · id : ${hi}`, lines: panes.right, source: section.b }}
          />
        </>
      ) : (
        <p className={styles.message}>
          두 버전의 {section?.label ?? "선택한 항목"} 내용이 동일합니다.
        </p>
      )}
    </div>
  );
}
