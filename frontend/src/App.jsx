import { Routes, Route } from "react-router-dom";
import AppLayout from "./components/common/AppLayout.jsx";
import RequireAuth from "./components/common/RequireAuth.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import ProjectConnectPage from "./pages/ProjectConnectPage.jsx";
import HistoryListPage from "./pages/HistoryListPage.jsx";
import HistoryDetailPage from "./pages/HistoryDetailPage.jsx";
import CompareHistoryPage from "./pages/CompareHistoryPage.jsx";

// 이력 화면(/, /history/:id, /compare)은 로그인/프로젝트 선택 없이 예전처럼 바로
// 보입니다 — RHH 자체 DB에서 조회하기 때문입니다. 로그인은 /connect(프로젝트별
// 동적 DB 연결 관리)에만 필요합니다.
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/connect" element={<ProjectConnectPage />} />
      </Route>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HistoryListPage />} />
        <Route path="/history/:id" element={<HistoryDetailPage />} />
        <Route path="/compare" element={<CompareHistoryPage />} />
      </Route>
    </Routes>
  );
}
