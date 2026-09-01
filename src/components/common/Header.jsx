import { Link } from "react-router-dom";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.brandCol}>
        <Link to="/" className={styles.logoLink}>
          <span className={styles.logo}>RH</span>
          <strong className={styles.title}>RENOBIT History Hub</strong>
        </Link>
      </div>
      <div className={styles.metaCol}>
        <span className={styles.project}>프로젝트: 스마트 관제 (main)</span>
      </div>
    </header>
  );
}
