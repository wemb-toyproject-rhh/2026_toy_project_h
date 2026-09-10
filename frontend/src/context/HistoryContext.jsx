import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { fetchHistoryEntries, updateHistoryMetadata, setImportant } from "../services/historyApi.js";
import { fetchAlarms, checkAlarm, checkAllAlarms } from "../services/alarmApi.js";
import { useAuth } from "./AuthContext.jsx";
import { useProjects } from "./ProjectContext.jsx";

const HistoryContext = createContext(null);

// 새 이력이 생겨도 새로고침을 눌러야만 보이는 문제를 완화하기 위한 백그라운드
// 폴링 주기입니다. 짧을수록 "실시간"에 가깝지만 그만큼 서버에 불필요한 요청이
// 늘어나므로, 사람이 RENOBIT에서 가끔 저장하는 정도의 빈도에 맞춘 값입니다.
const POLL_INTERVAL_MS = 20000;

export function HistoryProvider({ children }) {
  const { token } = useAuth();
  const { currentProject, loading: projectsLoading } = useProjects();
  const projectId = currentProject?.id ?? null;

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // 화면의 "갱신" 시각 표시용입니다 — 수동 새로고침이든 백그라운드 폴링이든,
  // 서버에서 실제로 이력을 성공적으로 다시 받아온 시점에만 갱신합니다
  // (updateMetadata처럼 항목 하나만 로컬로 바꾸는 경우는 포함하지 않습니다).
  const [lastFetchedAt, setLastFetchedAt] = useState(null);

  // 알림/목록에서 "새 이력"으로 표시할 기준 시각입니다. 백엔드에 읽음/안읽음이
  // 아직 없어서 세션 동안만 기억하는 임시 개념입니다 — 프로젝트를 열 때(전환
  // 포함) 그 순간으로 기준선을 다시 잡아서, 이미 있던 이력이 전부 "새 이력"으로
  // 보이는 걸 막습니다. 그 이후 폴링 등으로 새로 생긴 이력만 새 것으로 간주됩니다.
  const [lastSeenAt, setLastSeenAt] = useState(null);
  // 백엔드의 진짜 미확인 이력 목록(tb_alarm_check 기반, API_sub_알람관련.md)입니다.
  // 아직 배포 전이라 null(=모름)로 시작하고, 첫 조회에 성공하면 그때부터 이 값이
  // lastSeenAt 추정치보다 우선합니다. 배포되면 프론트 수정 없이 자동으로 이 값이
  // 쓰이게 됩니다.
  const [serverAlarmIds, setServerAlarmIds] = useState(null);
  useEffect(() => {
    if (projectId) setLastSeenAt(new Date());
    setServerAlarmIds(null);
  }, [projectId]);

  const refreshAlarms = useCallback(() => {
    if (!token || !projectId) return;
    fetchAlarms(token, projectId)
      .then((data) => setServerAlarmIds(new Set(data.map((entry) => entry.id))))
      .catch(() => {
        // /api/alarms가 아직 없거나(404) 실패하면 조용히 넘어가고, 아래
        // lastSeenAt 기반 추정치를 계속 씁니다.
      });
  }, [token, projectId]);

  useEffect(() => {
    refreshAlarms();
  }, [refreshAlarms]);

  const markAllSeen = useCallback(() => {
    setLastSeenAt(new Date());
    if (token && projectId) {
      checkAllAlarms(token, projectId)
        .then(() => setServerAlarmIds(new Set()))
        .catch(() => {
          // 백엔드 준비 전이면 위에서 이미 처리한 lastSeenAt만으로 동작합니다.
        });
    }
  }, [token, projectId]);

  // 이력 상세/Diff 화면에 들어가면 그 이력 하나만 "확인함"으로 표시합니다.
  // 백엔드 준비 전이면 실패를 조용히 무시합니다(로컬 추정치는 lastSeenAt 기준으로
  // 계속 동작하므로 화면엔 영향 없습니다).
  const checkEntrySeen = useCallback(
    (id) => {
      if (!token || !projectId || !id) return;
      checkAlarm(token, projectId, id)
        .then(() => {
          setServerAlarmIds((prev) => {
            if (!prev || !prev.has(id)) return prev;
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        })
        .catch(() => {});
    },
    [token, projectId],
  );

  const localNewEntryIds = useMemo(() => {
    if (!lastSeenAt) return new Set();
    const ids = new Set();
    entries.forEach((entry) => {
      if (new Date(entry.savedAtRaw) > lastSeenAt) ids.add(entry.id);
    });
    return ids;
  }, [entries, lastSeenAt]);

  // 서버가 실제로 응답한 적이 있으면(=배포됨) 그 값을 그대로 신뢰하고,
  // 아직이면(null) lastSeenAt 기반 추정치로 대신합니다.
  const newEntryIds = serverAlarmIds ?? localNewEntryIds;

  // 중요 표시(⭐)는 서버(tb_history_starred, 로그인한 사용자 본인만의 값)가
  // 진실 값입니다 — GET /api/history 가 내려주는 entry.important 를 그대로
  // 반영합니다. 낙관적으로 먼저 반영하고, 실패하면(예: 이 프로젝트에 아직
  // tb_history_starred 테이블이 없는 경우) 원래 상태로 되돌립니다.
  const starredIds = useMemo(
    () => new Set(entries.filter((entry) => entry.important).map((entry) => entry.id)),
    [entries],
  );

  const toggleStar = useCallback(
    (id) => {
      if (!projectId) return;
      const target = entries.find((entry) => entry.id === id);
      if (!target) return;
      const nextImportant = !target.important;
      setEntries((prev) =>
        prev.map((entry) => (entry.id === id ? { ...entry, important: nextImportant } : entry)),
      );
      setImportant(token, projectId, id, nextImportant).catch(() => {
        setEntries((prev) =>
          prev.map((entry) => (entry.id === id ? { ...entry, important: !nextImportant } : entry)),
        );
      });
    },
    [projectId, token, entries],
  );

  // "다시 시도"를 연달아 누르는 경우 등, 늦게 도착한 이전 요청의 결과가 최신 결과를
  // 덮어쓰지 않도록 requestId 로 "가장 최근 요청"만 반영합니다. 백그라운드 폴링은
  // loading 상태를 공유하지 않는 별도 흐름이라 카운터도 따로 둡니다 — 같이 쓰면
  // 폴링 응답이 늦게 와서 reload()의 요청을 "낡은 것"으로 취급해버려 loading이
  // false로 안 돌아오는 문제가 생길 수 있습니다.
  const requestIdRef = useRef(0);
  const silentRequestIdRef = useRef(0);

  const reload = useCallback(() => {
    if (!token) {
      setEntries([]);
      setError(null);
      setLoading(false);
      return;
    }
    // 프로젝트 목록이 아직 로딩 중이면(=currentProject가 잠깐 null일 수 있음) 그
    // "프로젝트 없음" 상태로 오판하지 않도록 로딩을 유지하고 기다립니다.
    if (projectsLoading) {
      setLoading(true);
      return;
    }
    if (!projectId) {
      setEntries([]);
      setError(null);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    fetchHistoryEntries(token, projectId)
      .then((data) => {
        if (requestIdRef.current !== requestId) return;
        setEntries(data);
        setLastFetchedAt(new Date());
      })
      .catch((err) => {
        if (requestIdRef.current !== requestId) return;
        setEntries([]);
        setError(err.message);
      })
      .finally(() => {
        if (requestIdRef.current !== requestId) return;
        setLoading(false);
      });
  }, [token, projectId, projectsLoading]);

  useEffect(() => {
    reload();
  }, [reload]);

  // reload()와 달리 loading/error를 건드리지 않는 조용한 새로고침입니다 — 화면은
  // 그대로 둔 채로 데이터만 최신화해서, 폴링 때마다 목록이 사라졌다 다시 뜨는
  // 깜빡임 없이 새 이력이 자연스럽게 섞여 들어오게 합니다. 카드 목록은 이미
  // entry.id를 key로 쓰고 있어서 배열이 새로 생겨도 기존 카드가 재사용됩니다.
  const silentRefresh = useCallback(() => {
    if (!token || projectsLoading || !projectId) return;

    const requestId = ++silentRequestIdRef.current;
    fetchHistoryEntries(token, projectId)
      .then((data) => {
        if (silentRequestIdRef.current !== requestId) return;
        setEntries(data);
        setLastFetchedAt(new Date());
      })
      .catch(() => {
        // 백그라운드 폴링 실패는 화면에 드러내지 않고 조용히 넘어갑니다 —
        // 다음 폴링 때 다시 시도하면 됩니다.
      });
  }, [token, projectId, projectsLoading]);

  useEffect(() => {
    if (!token || !projectId) return undefined;

    const timerId = setInterval(() => {
      // 탭이 백그라운드에 있을 땐 굳이 폴링하지 않습니다.
      if (document.visibilityState === "visible") {
        silentRefresh();
        refreshAlarms();
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timerId);
  }, [token, projectId, silentRefresh, refreshAlarms]);

  const updateMetadata = useCallback(
    async (id, fields) => {
      const updated = await updateHistoryMetadata(token, projectId, id, fields);
      // 숨김 처리된 이력은 GET /api/history 응답에도 더는 안 나오므로, 로컬
      // 상태에서도 같이 걷어내서 "전체 이력 보기"에 즉시 반영되게 합니다.
      setEntries((prev) =>
        updated.hidden
          ? prev.filter((entry) => entry.id !== id)
          : prev.map((entry) => (entry.id === id ? updated : entry)),
      );
    },
    [token, projectId],
  );

  return (
    <HistoryContext.Provider
      value={{
        entries,
        loading,
        error,
        reload,
        updateMetadata,
        hasProject: Boolean(projectId),
        lastFetchedAt,
        newEntryIds,
        markAllSeen,
        checkEntrySeen,
        starredIds,
        toggleStar,
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error("useHistory must be used within a HistoryProvider");
  return ctx;
}

// Header처럼 HistoryProvider가 없는 화면(계정 설정 등)에도 함께 쓰이는 컴포넌트를
// 위한 안전한 버전입니다 — 프로바이더가 없으면 에러 대신 null을 돌려줍니다.
export function useHistoryOptional() {
  return useContext(HistoryContext);
}
