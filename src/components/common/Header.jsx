import { NavLink } from "react-router-dom";
import styles from "./Header.module.css";

const NAV_ITEMS = [
  { to: "/", label: "이력 리스트", end: true },
  { to: "/history/12", label: "이력 상세" },
  { to: "/compare", label: "버전 비교" },
];

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.logo}>RH</span>
        <strong className={styles.title}>RENOBIT History Hub</strong>
        <span className={styles.divider}>|</span>
        <span className={styles.project}>프로젝트: 스마트 관제 (main)</span>
      </div>

      <nav className={styles.switcher}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `${styles.switchBtn} ${isActive ? styles.active : ""}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
