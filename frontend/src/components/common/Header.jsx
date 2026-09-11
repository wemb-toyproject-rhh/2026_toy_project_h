import { Link, useNavigate } from "react-router-dom";
import ProjectSwitcher from "./ProjectSwitcher.jsx";
import NotificationBell from "./NotificationBell.jsx";
import ShortcutsHelp from "./ShortcutsHelp.jsx";
import Icon from "./Icon.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./Header.module.css";

export default function Header({ hideProjectSwitcher = false }) {
  const { userId, userName, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className={styles.header}>
      <div className={styles.brandCol}>
        <Link
          to="/"
          className={styles.logoLink}
          aria-label="RENOBIT History Hub 홈으로 이동"
        >
          <span className={styles.brand} aria-hidden="true">
            <strong className={styles.brandShort}>RHH</strong>
            <strong className={styles.brandFull}>RENOBIT History Hub</strong>
          </span>
        </Link>
      </div>
      <div className={styles.metaCol}>
        {!hideProjectSwitcher && <ProjectSwitcher />}
      </div>
      <div className={styles.actionCol}>
        <div className={styles.userGroup}>
          <span className={styles.user}>{userName || userId || "-"}</span>
          <Link to="/account" className={styles.settingsBtn} aria-label="계정 설정" title="계정 설정">
            <Icon name="settings" size={15} />
          </Link>
        </div>
        <NotificationBell />
        <ShortcutsHelp />
        <button type="button" className={styles.logout} onClick={handleLogout}>
          로그아웃
        </button>
      </div>
    </header>
  );
}
