import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header.jsx";
import SidebarFilter from "../history/SidebarFilter.jsx";
import useNewHistoryAlert from "../../hooks/useNewHistoryAlert.js";
import styles from "./AppLayout.module.css";

export default function AppLayout() {
  // 사이드바에서 선택한 타겟. 하위 페이지에는 Outlet context 로 전달합니다.
  //   { kind: "all" }
  //   { kind: "page",     targetId, name }
  //   { kind: "instance", targetId, name, category }
  const [selected, setSelected] = useState({ kind: "all" });
  const {
    newItems,
    previousItems,
    clear: clearNewHistory,
    dismiss: dismissNewHistory,
  } = useNewHistoryAlert();

  return (
    <div className={styles.shell}>
      <Header
        newItems={newItems}
        previousItems={previousItems}
        onClearNew={clearNewHistory}
        onDismissNew={dismissNewHistory}
      />
      <div className={styles.body}>
        <SidebarFilter selected={selected} onSelect={setSelected} />
        <main className={styles.content}>
          <Outlet context={{ selected }} />
        </main>
      </div>
    </div>
  );
}
