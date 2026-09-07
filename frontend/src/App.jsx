import { Routes, Route } from "react-router-dom";
import AppLayout from "./components/common/AppLayout.jsx";
import HeaderLayout from "./components/common/HeaderLayout.jsx";
import RequireAuth from "./components/common/RequireAuth.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import ProjectConnectPage from "./pages/ProjectConnectPage.jsx";
import AccountSettingsPage from "./pages/AccountSettingsPage.jsx";
import HistoryListPage from "./pages/HistoryListPage.jsx";
import HistoryDetailPage from "./pages/HistoryDetailPage.jsx";
import CompareHistoryPage from "./pages/CompareHistoryPage.jsx";

// 이력 화면(/, /history/:id, /compare)도 이제 로그인 + 프로젝트 선택이 필요합니다 —
// 백엔드가 "선택된 프로젝트가 가리키는 대상 DB"에서 이력을 조회하는 방식으로
// 바뀌었기 때문입니다(예전엔 RHH 자체 고정 DB를 봐서 로그인 없이도 보였습니다).
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/connect" element={<ProjectConnectPage />} />
        <Route element={<HeaderLayout />}>
          <Route path="/account" element={<AccountSettingsPage />} />
        </Route>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HistoryListPage />} />
          <Route path="/history/:id" element={<HistoryDetailPage />} />
          <Route path="/compare" element={<CompareHistoryPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
