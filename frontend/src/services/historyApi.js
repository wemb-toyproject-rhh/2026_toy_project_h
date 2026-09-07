const BASE = "/api/history";

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

async function parseErrorResponse(res, fallbackMessage) {
  const data = await res.json().catch(() => ({}));
  return new Error(data.error || `${fallbackMessage} (${res.status})`);
}

// 백엔드가 주는 savedAt은 "2026-09-04T15:00:13" 형태(ISO 구분자 T)인데, 화면엔
// "2026-09-04/15:00:13"처럼 보여줍니다. savedAtRaw는 Date 파싱/정렬용이라 그대로 둡니다.
function formatEntry(entry) {
  return { ...entry, savedAt: entry.savedAt?.replace("T", "/") };
}

// projectId 로 "어느 프로젝트(대상 DB)" 이력인지 지정합니다 — 로그인 + 내 프로젝트인지
// 확인된 projectId 가 둘 다 있어야 백엔드가 응답합니다.
export async function fetchHistoryEntries(token, projectId) {
  const res = await fetch(`${BASE}?projectId=${encodeURIComponent(projectId)}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await parseErrorResponse(res, "이력 목록을 불러오지 못했습니다");
  const data = await res.json();
  return data.map(formatEntry);
}

// fields: { title } / { comment } / { hidden } — only the keys provided are updated.
export async function updateHistoryMetadata(token, projectId, id, fields) {
  const res = await fetch(`${BASE}/${id}/metadata?projectId=${encodeURIComponent(projectId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw await parseErrorResponse(res, "저장하지 못했습니다");
  const data = await res.json();
  return formatEntry(data);
}
