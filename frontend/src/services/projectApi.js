// RHH 프로젝트 CRUD. 전부 로그인 토큰이 있어야 호출할 수 있습니다 (requireAuth).
import { API_ORIGIN } from "./apiBase.js";

const BASE = `${API_ORIGIN}/api/rhh/projects`;

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

async function parseErrorResponse(res, fallbackMessage) {
  const data = await res.json().catch(() => ({}));
  const error = new Error(data.error || `${fallbackMessage} (${res.status})`);
  error.status = res.status;
  return error;
}

export async function fetchProjects(token) {
  const res = await fetch(BASE, { headers: authHeaders(token) });
  if (!res.ok) throw await parseErrorResponse(res, "프로젝트 목록을 불러오지 못했습니다");
  return res.json();
}

// 등록 전에 접속 정보만 미리 확인합니다. 응답 자체는 항상 200이고, 성공 여부는
// { ok, error } 로 옵니다 — "연결 테스트" 버튼이 이 결과를 그대로 화면에 보여줍니다.
export async function testConnection(token, fields) {
  const res = await fetch(`${BASE}/test-connection`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw await parseErrorResponse(res, "연결 테스트에 실패했습니다");
  return res.json();
}

// POST /api/rhh/projects/install-schema — 없는 테이블/트리거만 대상 DB에 생성합니다.
// dryRun:true 면 실행하지 않고 "무엇을 설치할지"(plan)만 반환합니다. testConnection과
// 같은 방식으로, 실패해도(400) 서버가 { ok:false, error } 형태의 JSON을 그대로 주므로
// throw 하지 않고 그 결과를 그대로 반환합니다 — 호출부가 result.ok로 분기합니다.
export async function installSchema(token, fields, dryRun) {
  try {
    const res = await fetch(`${BASE}/install-schema`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify({ ...fields, dryRun }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: false, error: "자동 설치 요청에 실패했습니다", ...data };
  } catch {
    return { ok: false, error: "자동 설치 요청에 실패했습니다" };
  }
}

export async function createProject(token, fields) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw await parseErrorResponse(res, "프로젝트 등록에 실패했습니다");
  return res.json();
}

export async function renameProject(token, projectId, projectName) {
  const res = await fetch(`${BASE}/${projectId}/name`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ projectName }),
  });
  if (!res.ok) throw await parseErrorResponse(res, "프로젝트 이름 수정에 실패했습니다");
  return res.json();
}

export async function deleteProject(token, projectId) {
  const res = await fetch(`${BASE}/${projectId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await parseErrorResponse(res, "연결 끊기에 실패했습니다");
  return res.json();
}

// "최근 접속 프로젝트" 기록. tb_user_rhh.project_recent 에 저장됩니다.
export async function setRecentProject(token, projectId) {
  const res = await fetch("/api/rhh/users/me/recent-project", {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ projectId }),
  });
  if (!res.ok) throw await parseErrorResponse(res, "최근 접속 프로젝트 저장에 실패했습니다");
  return res.json();
}
