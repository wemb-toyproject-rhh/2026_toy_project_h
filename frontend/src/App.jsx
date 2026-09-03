import { Routes, Route } from "react-router-dom";
import AppLayout from "./components/common/AppLayout.jsx";
import HistoryListPage from "./pages/HistoryListPage.jsx";
import HistoryDetailPage from "./pages/HistoryDetailPage.jsx";
import CompareHistoryPage from "./pages/CompareHistoryPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HistoryListPage />} />
        <Route path="/history/:id" element={<HistoryDetailPage />} />
        <Route path="/compare" element={<CompareHistoryPage />} />
      </Route>
    </Routes>
  );
}
