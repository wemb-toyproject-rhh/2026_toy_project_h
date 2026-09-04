import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { fetchHistoryEntries, updateHistoryMetadata } from "../services/historyApi.js";

const HistoryContext = createContext(null);

export function HistoryProvider({ children }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchHistoryEntries()
      .then(setEntries)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const updateTitle = useCallback(async (id, title) => {
    const updated = await updateHistoryMetadata(id, title);
    setEntries((prev) => prev.map((entry) => (entry.id === id ? updated : entry)));
  }, []);

  return (
    <HistoryContext.Provider value={{ entries, loading, error, reload, updateTitle }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error("useHistory must be used within a HistoryProvider");
  return ctx;
}
