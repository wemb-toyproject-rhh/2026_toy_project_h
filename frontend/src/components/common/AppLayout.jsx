import { Outlet } from "react-router-dom";
import { HistoryProvider } from "../../context/HistoryContext.jsx";
import Header from "./Header.jsx";
import SidebarFilter from "../history/SidebarFilter.jsx";
import styles from "./AppLayout.module.css";

export default function AppLayout() {
  return (
    <HistoryProvider>
      <div className={styles.shell}>
        <Header />
        <div className={styles.body}>
          <SidebarFilter />
          <main className={styles.content} data-scroll-container>
            <Outlet />
          </main>
        </div>
      </div>
    </HistoryProvider>
  );
}
