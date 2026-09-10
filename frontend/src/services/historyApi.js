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

// GET /api/history/trash?projectId= — hidden=true인 이력만 모아서 반환합니다.
export async function fetchTrashEntries(token, projectId) {
  const res = await fetch(`${BASE}/trash?projectId=${encodeURIComponent(projectId)}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await parseErrorResponse(res, "휴지통을 불러오지 못했습니다");
  const data = await res.json();
  return data.map(formatEntry);
}

// DELETE /api/history/:id?projectId= — hidden=true인 것만 지울 수 있는 영구 삭제입니다.
export async function deleteEntryPermanently(token, projectId, id) {
  const res = await fetch(`${BASE}/${id}?projectId=${encodeURIComponent(projectId)}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await parseErrorResponse(res, "영구 삭제에 실패했습니다");
  return res.json();
}

// PUT /api/history/:id/important?projectId= — 로그인한 사용자 본인만의 중요 표시(⭐) 토글.
export async function setImportant(token, projectId, id, important) {
  const res = await fetch(`${BASE}/${id}/important?projectId=${encodeURIComponent(projectId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ important }),
  });
  if (!res.ok) throw await parseErrorResponse(res, "중요 표시를 변경하지 못했습니다");
  return res.json();
}

// DELETE /api/history/trash?projectId= — 휴지통 비우기(hidden=true 전체 영구 삭제).
export async function emptyTrash(token, projectId) {
  const res = await fetch(`${BASE}/trash?projectId=${encodeURIComponent(projectId)}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await parseErrorResponse(res, "휴지통 비우기에 실패했습니다");
  return res.json();
}
