import { useCallback, useEffect, useRef, useState } from "react";

// 사이드바가 이력을 다시 불러오는 주기와 맞춥니다.
const POLL_MS = 10_000;
// "이전 이력" 탭에 보여줄 최대 개수. 전체 이력은 이력 리스트 화면에서 봅니다.
const PREVIOUS_LIMIT = 20;

/**
 * /api/history 를 주기적으로 불러 새로 생긴 항목(안 읽음)과
 * 이미 읽은 이전 항목을 나눠서 돌려줍니다.
 * 처음 불러온 목록은 기준값으로만 쓰고 안 읽음 처리하지 않습니다.
 */
export default function useNewHistoryAlert() {
  const [items, setItems] = useState([]);
  const [unreadIds, setUnreadIds] = useState(() => new Set());
  const seenKeysRef = useRef(null);
  const aliveRef = useRef(true);

  const check = useCallback(async () => {
    try {
      const res = await fetch("/api/history");
      if (!res.ok) return;
      const json = await res.json();
      if (!aliveRef.current) return;

      const mapped = (json.items ?? []).map((it) => ({
        id: `${it.kind}-${it.histId}`,
        label: it.label,
        name: it.name,
        savedAt: it.savedAt,
        author: it.author,
      }));
      const currentKeys = new Set(mapped.map((it) => it.id));

      setItems(mapped);

      if (seenKeysRef.current === null) {
        seenKeysRef.current = currentKeys;
        return;
      }

      const freshIds = mapped.filter((it) => !seenKeysRef.current.has(it.id)).map((it) => it.id);
      if (freshIds.length > 0) {
        setUnreadIds((prev) => new Set([...prev, ...freshIds]));
      }
      seenKeysRef.current = currentKeys;
    } catch {
      // 조회 실패는 조용히 무시합니다 (사이드바 쪽에서 이미 실패 상태를 보여줍니다).
    }
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    check();

    const timer = setInterval(() => {
      if (document.visibilityState === "visible") check();
    }, POLL_MS);

    return () => {
      aliveRef.current = false;
      clearInterval(timer);
    };
  }, [check]);

  const clear = useCallback(() => setUnreadIds(new Set()), []);
  const dismiss = useCallback((id) => {
    setUnreadIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const newItems = items.filter((it) => unreadIds.has(it.id));
  const previousItems = items.filter((it) => !unreadIds.has(it.id)).slice(0, PREVIOUS_LIMIT);

  return { newItems, previousItems, clear, dismiss };
}
