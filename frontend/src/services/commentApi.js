import { API_ORIGIN } from "./apiBase.js";

const BASE = `${API_ORIGIN}/api/history`;

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

async function parseErrorResponse(res, fallbackMessage) {
  const data = await res.json().catch(() => ({}));
  return new Error(data.error || `${fallbackMessage} (${res.status})`);
}

// GET /api/history/:id/comments?projectId= — 오래된순 댓글 목록(작성자 닉네임 포함).
export async function fetchComments(token, projectId, entryId) {
  const res = await fetch(`${BASE}/${entryId}/comments?projectId=${encodeURIComponent(projectId)}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await parseErrorResponse(res, "댓글을 불러오지 못했습니다");
  return res.json();
}

// POST /api/history/:id/comments?projectId= — 댓글 작성. 작성자는 항상 토큰 주인입니다.
export async function createComment(token, projectId, entryId, content) {
  const res = await fetch(`${BASE}/${entryId}/comments?projectId=${encodeURIComponent(projectId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw await parseErrorResponse(res, "댓글 작성에 실패했습니다");
  return res.json();
}

// PUT /api/history/comments/:commentId?projectId= — 댓글 수정. 작성자 본인만 가능(403).
export async function updateComment(token, projectId, commentId, content) {
  const res = await fetch(`${BASE}/comments/${commentId}?projectId=${encodeURIComponent(projectId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw await parseErrorResponse(res, "댓글 수정에 실패했습니다");
  return res.json();
}

// DELETE /api/history/comments/:commentId?projectId= — 댓글 삭제. 작성자 본인만 가능(403).
export async function deleteComment(token, projectId, commentId) {
  const res = await fetch(`${BASE}/comments/${commentId}?projectId=${encodeURIComponent(projectId)}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await parseErrorResponse(res, "댓글 삭제에 실패했습니다");
  return res.json();
}
