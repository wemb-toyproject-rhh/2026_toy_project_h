import CopyButton from "../common/CopyButton.jsx";
import DiffBlock from "../common/DiffBlock.jsx";
import VersionSelect from "./VersionSelect.jsx";
import styles from "./SideBySideDiff.module.css";

export default function SideBySideDiff({ left, right }) {
  return (
    <div className={styles.grid}>
      {[left, right].map((pane, idx) => (
        <div key={idx} className={styles.pane}>
          <div className={styles.paneHeader}>
            <VersionSelect
              label={pane.label}
              meta={pane.meta}
              options={pane.options}
              onSelect={pane.onSelect}
            />
            <CopyButton text={pane.code} label={`${pane.label} 코드 복사`} />
          </div>
          <DiffBlock lines={pane.lines} />
        </div>
      ))}
    </div>
  );
}
