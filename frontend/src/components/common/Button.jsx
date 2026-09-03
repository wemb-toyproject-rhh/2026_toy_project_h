import styles from "./Button.module.css";

export default function Button({
  children,
  variant = "default",
  size = "md",
  className = "",
  ...rest
}) {
  return (
    <button
      className={`${styles.btn} ${styles[variant]} ${styles[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
