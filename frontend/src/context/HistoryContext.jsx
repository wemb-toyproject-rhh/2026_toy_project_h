import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { fetchHistoryEntries, updateHistoryMetadata } from "../services/historyApi.js";

const HistoryContext = createContext(null);

export function HistoryProvider({ children }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // "다시 시도"를 연달아 누르는 경우 등, 늦게 도착한 이전 요청의 결과가 최신 결과를
  // 덮어쓰지 않도록 requestId 로 "가장 최근 요청"만 반영합니다.
  const requestIdRef = useRef(0);

  const reload = useCallback(() => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    fetchHistoryEntries()
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
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const updateMetadata = useCallback(async (id, fields) => {
    const updated = await updateHistoryMetadata(id, fields);
    // 숨김 처리된 이력은 GET /api/history 응답에도 더는 안 나오므로, 로컬
    // 상태에서도 같이 걷어내서 "전체 이력 보기"에 즉시 반영되게 합니다.
    setEntries((prev) =>
      updated.hidden
        ? prev.filter((entry) => entry.id !== id)
        : prev.map((entry) => (entry.id === id ? updated : entry)),
    );
  }, []);

  return (
    <HistoryContext.Provider value={{ entries, loading, error, reload, updateMetadata }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error("useHistory must be used within a HistoryProvider");
  return ctx;
}
