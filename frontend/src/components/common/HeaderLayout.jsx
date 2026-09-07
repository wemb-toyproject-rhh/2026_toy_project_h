import { Outlet } from "react-router-dom";
import Header from "./Header.jsx";
import styles from "./AppLayout.module.css";

export default function HeaderLayout() {
  return (
    <div className={styles.shell}>
      <Header />
      <main className={styles.content} data-scroll-container>
        <Outlet />
      </main>
    </div>
  );
}
