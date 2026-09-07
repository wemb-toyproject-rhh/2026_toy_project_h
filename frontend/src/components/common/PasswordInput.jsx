import { useState } from "react";
import Icon from "./Icon.jsx";
import styles from "./PasswordInput.module.css";

export default function PasswordInput({ className = "", style, ...rest }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.wrap}>
      <input
        {...rest}
        type={visible ? "text" : "password"}
        className={className}
        style={{ ...style, width: "100%", boxSizing: "border-box", paddingRight: 32 }}
      />
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "비밀번호 숨기기" : "비밀번호 표시"}
        tabIndex={-1}
      >
        <Icon name={visible ? "eyeOff" : "eye"} size={14} />
      </button>
    </div>
  );
}
