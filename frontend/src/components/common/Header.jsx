import { Link } from "react-router-dom";
import ProjectSwitcher from "./ProjectSwitcher.jsx";
import Icon from "./Icon.jsx";
import styles from "./Header.module.css";

export default function Header() {
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
        <ProjectSwitcher />
      </div>
      <div className={styles.actionCol}>
        <div className={styles.userGroup}>
          <span className={styles.user}>kim.dev</span>
          <Link to="/account" className={styles.settingsBtn} aria-label="계정 설정" title="계정 설정">
            <Icon name="settings" size={15} />
          </Link>
        </div>
        <Link to="/login" className={styles.logout}>
          로그아웃
        </Link>
      </div>
    </header>
  );
}
