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
            {/* 화면에 보이는 diff 가 아니라, 그 버전의 스크립트 전문을 복사합니다. */}
            <CopyButton text={pane.source} />
          </div>
          <DiffBlock lines={pane.lines} />
        </div>
      ))}
    </div>
  );
}
