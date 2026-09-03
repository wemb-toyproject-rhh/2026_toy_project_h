import { Link } from "react-router-dom";
import styles from "./BackLink.module.css";

export default function BackLink({ to = "/", children = "이력 리스트" }) {
  return (
    <Link to={to} className={styles.link}>
      <span aria-hidden="true">←</span>
      {children}
    </Link>
  );
}
