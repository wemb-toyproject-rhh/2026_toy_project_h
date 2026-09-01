import styles from "./DiffBlock.module.css";

export default function DiffBlock({ lines }) {
  return (
    <div className={styles.diff}>
      {lines.map((line, idx) => (
        <div
          key={idx}
          className={`${styles.line} ${line.type ? styles[line.type] : ""}`}
        >
          <span className={styles.gutter}>{line.no ?? ""}</span>
          <span className={styles.marker}>
            {line.type === "add" ? "+" : line.type === "del" ? "-" : ""}
          </span>
          <span className={styles.code}>{line.code}</span>
        </div>
      ))}
    </div>
  );
}
