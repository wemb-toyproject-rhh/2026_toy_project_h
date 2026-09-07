import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

// 로그인 안 한 상태로 "/", "/connect" 등에 직접 들어오면 로그인 화면으로 보냅니다.
export default function RequireAuth() {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}
