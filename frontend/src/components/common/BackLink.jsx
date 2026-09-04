import { useNavigate } from "react-router-dom";
import styles from "./BackLink.module.css";

// Uses browser-history back (not a fixed Link to "/") so the list page's
// active filters/sort — carried in its URL query string — are preserved.
export default function BackLink({ children = "이력 리스트" }) {
  const navigate = useNavigate();

  return (
    <button type="button" className={styles.link} onClick={() => navigate(-1)}>
      <span aria-hidden="true">←</span>
      {children}
    </button>
  );
}
