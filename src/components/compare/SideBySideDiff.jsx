import Button from "../common/Button.jsx";
import DiffBlock from "../common/DiffBlock.jsx";
import styles from "./SideBySideDiff.module.css";

export default function SideBySideDiff({ left, right }) {
  return (
    <div className={styles.grid}>
      {[left, right].map((pane, idx) => (
        <div key={idx} className={styles.pane}>
          <div className={styles.paneHeader}>
            <strong>{pane.label}</strong>
            <Button variant="ghost" size="sm">
              전체 복사
            </Button>
          </div>
          <DiffBlock lines={pane.lines} />
        </div>
      ))}
    </div>
  );
}
