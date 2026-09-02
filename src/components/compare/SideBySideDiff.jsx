import CopyButton from "../common/CopyButton.jsx";
import DiffBlock from "../common/DiffBlock.jsx";
import styles from "./SideBySideDiff.module.css";

export default function SideBySideDiff({ left, right }) {
  return (
    <div className={styles.grid}>
      {[left, right].map((pane, idx) => (
        <div key={idx} className={styles.pane}>
          <div className={styles.paneHeader}>
            <strong>{pane.label}</strong>
            <CopyButton
              text={pane.code}
              label={`${pane.label} 코드 복사`}
              variant="ghost"
              size="sm"
            >
              전체 복사
            </CopyButton>
          </div>
          <DiffBlock lines={pane.lines} />
        </div>
      ))}
    </div>
  );
}
