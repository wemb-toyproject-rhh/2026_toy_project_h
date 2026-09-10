// API_sub_알람관련.md 스펙에 맞춘 서비스 함수입니다. 백엔드 팀원이 아직 이 세 엔드포인트와
// tb_alarm_check 테이블을 배포하기 전이라 지금은 항상 실패(404 등)합니다 — 호출하는 쪽
// (HistoryContext)이 실패를 조용히 잡아서 기존 로컬 추정 방식으로 대체하므로, 배포 전에도
// 화면이 깨지지 않습니다. 배포되면 별도 프론트 수정 없이 그대로 동작합니다.
const BASE = "/api/alarms";

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

async function parseErrorResponse(res, fallbackMessage) {
  const data = await res.json().catch(() => ({}));
  return new Error(data.error || `${fallbackMessage} (${res.status})`);
}

// GET /api/alarms?projectId= — 로그인 사용자가 이 프로젝트에서 아직 "확인"하지 않은
// 이력 목록. 항목 모양은 GET /api/history와 동일합니다.
export async function fetchAlarms(token, projectId) {
  const res = await fetch(`${BASE}?projectId=${encodeURIComponent(projectId)}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await parseErrorResponse(res, "미확인 이력을 불러오지 못했습니다");
  return res.json();
}

// POST /api/alarms/:id/check?projectId= — 이력 하나를 "확인함"으로 표시합니다.
export async function checkAlarm(token, projectId, id) {
  const res = await fetch(`${BASE}/${id}/check?projectId=${encodeURIComponent(projectId)}`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await parseErrorResponse(res, "확인 처리에 실패했습니다");
  return res.json();
}

// POST /api/alarms/check-all?projectId= — 이 프로젝트의 미확인 이력을 한 번에 전부 확인 처리합니다.
export async function checkAllAlarms(token, projectId) {
  const res = await fetch(`${BASE}/check-all?projectId=${encodeURIComponent(projectId)}`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await parseErrorResponse(res, "전체 확인 처리에 실패했습니다");
  return res.json();
}
