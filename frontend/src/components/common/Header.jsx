import { Link } from "react-router-dom";
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
        <span className={styles.project}>프로젝트: 스마트 관제 (main)</span>
      </div>
    </header>
  );
}
