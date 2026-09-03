import { useState } from "react";
import Button from "./Button.jsx";
import Icon from "./Icon.jsx";
import { copyToClipboard } from "../../utils/clipboard.js";
import styles from "./CopyButton.module.css";

export default function CopyButton({
  text,
  label = "코드 복사",
  variant = "primary",
  size = "icon",
  children,
}) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    await copyToClipboard(text ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={styles.wrap}>
      <Button
        variant={variant}
        size={size}
        aria-label={label}
        title={label}
        onClick={handleClick}
      >
        {children ?? <Icon name={copied ? "check" : "copy"} size={14} />}
      </Button>
      {copied && <span className={styles.toast}>복사되었습니다</span>}
    </div>
  );
}
