import { NavLink, useLocation } from "react-router-dom";
import NotificationBell from "./NotificationBell.jsx";
import styles from "./Header.module.css";

export default function Header({ newItems = [], previousItems = [], onClearNew, onDismissNew }) {
  const { pathname } = useLocation();
  // 이력 상세는 주소가 /history/page-33 처럼 매번 달라서 경로 앞부분으로 판단합니다.
  const onDetail = pathname.startsWith("/history/");

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <strong className={styles.logo}>RHH</strong>
        <span className={styles.project}>프로젝트: 스마트 관제 (main)</span>
      </div>

      <div className={styles.rightGroup}>
        <nav className={styles.switcher}>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${styles.switchBtn} ${isActive ? styles.active : ""}`
            }
          >
            이력 리스트
          </NavLink>

          {/* 목록에서 항목을 골라야 볼 수 있는 화면이라, 그 전에는 눌러도 이동하지 않습니다. */}
          <span
            className={`${styles.switchBtn} ${onDetail ? styles.active : styles.disabled}`}
            title={onDetail ? undefined : "이력 리스트에서 항목을 선택하세요"}
          >
            이력 상세
          </span>

          <NavLink
            to="/compare"
            className={({ isActive }) =>
              `${styles.switchBtn} ${isActive ? styles.active : ""}`
            }
          >
            버전 비교
          </NavLink>
        </nav>

        <NotificationBell
          newItems={newItems}
          previousItems={previousItems}
          onClear={onClearNew}
          onDismiss={onDismissNew}
        />
      </div>
    </header>
  );
}
