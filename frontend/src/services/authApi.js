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
  return data; // { token, userId, projectRecent }
}
