import { createContext, useCallback, useContext, useState } from "react";

// 로그인 상태를 localStorage 에 저장해서 새로고침해도 유지되게 합니다
// ("로그인 상태를 유지한다" 요구사항). 임시 계정 관리 단계라 간단하게 갑니다.
const STORAGE_KEY = "rhh_auth";

const AuthContext = createContext(null);

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth);

  const login = useCallback((token, userId, projectRecent = null) => {
    const next = { token, userId, projectRecent };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setAuth(next);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAuth(null);
  }, []);

  // 최근 접속 프로젝트가 바뀔 때마다 세션에 반영합니다 — 새로고침해도
  // (재로그인 없이) 방금 선택한 프로젝트가 기본으로 뜨게 하기 위해서입니다.
  const setProjectRecent = useCallback((projectId) => {
    setAuth((prev) => {
      if (!prev) return prev;
      const next = { ...prev, projectRecent: projectId };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token: auth?.token ?? null,
        userId: auth?.userId ?? null,
        projectRecent: auth?.projectRecent ?? null,
        login,
        logout,
        setProjectRecent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
