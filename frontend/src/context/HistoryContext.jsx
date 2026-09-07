import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { fetchHistoryEntries, updateHistoryMetadata } from "../services/historyApi.js";
import { useAuth } from "./AuthContext.jsx";
import { useProjects } from "./ProjectContext.jsx";

const HistoryContext = createContext(null);

export function HistoryProvider({ children }) {
  const { token } = useAuth();
  const { currentProject, loading: projectsLoading } = useProjects();
  const projectId = currentProject?.id ?? null;

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // "다시 시도"를 연달아 누르는 경우 등, 늦게 도착한 이전 요청의 결과가 최신 결과를
  // 덮어쓰지 않도록 requestId 로 "가장 최근 요청"만 반영합니다.
  const requestIdRef = useRef(0);

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
      value={{ entries, loading, error, reload, updateMetadata, hasProject: Boolean(projectId) }}
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
