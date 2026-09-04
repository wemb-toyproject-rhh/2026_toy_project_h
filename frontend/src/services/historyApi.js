const BASE = "/api/history";

export async function fetchHistoryEntries() {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error(`이력 목록을 불러오지 못했습니다 (${res.status})`);
  return res.json();
}

// fields: { title } and/or { comment } — only the keys provided are updated.
export async function updateHistoryMetadata(id, fields) {
  const res = await fetch(`${BASE}/${id}/metadata`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error(`저장하지 못했습니다 (${res.status})`);
  return res.json();
}
