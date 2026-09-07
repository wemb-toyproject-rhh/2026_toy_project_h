const BASE = "/api/rhh";

export async function register(userId, password) {
  const res = await fetch(`${BASE}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `회원가입에 실패했습니다 (${res.status})`);
  return data; // { userId }
}

export async function login(userId, password) {
  const res = await fetch(`${BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `로그인에 실패했습니다 (${res.status})`);
  return data; // { token, userId, projectRecent, userName }
}

// 빈 문자열을 보내면 닉네임을 지웁니다(백엔드가 null로 저장).
export async function changeNickname(token, userName) {
  const res = await fetch(`${BASE}/users/me/nickname`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userName }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `닉네임 변경에 실패했습니다 (${res.status})`);
  return data; // { userName }
}

export async function changePassword(token, currentPassword, newPassword) {
  const res = await fetch(`${BASE}/users/me/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `비밀번호 변경에 실패했습니다 (${res.status})`);
  return data; // { ok: true }
}
