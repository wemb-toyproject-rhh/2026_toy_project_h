import { useNavigate } from "react-router-dom";
import Button from "../components/common/Button.jsx";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate("/");
  };

  return (
    <div className={styles.screen}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <span className={styles.brand}>RHH</span>
        <h1 className={styles.title}>RENOBIT History Hub</h1>
        <p className={styles.subtitle}>계정으로 로그인하세요</p>

        <label className={styles.field}>
          <span className={styles.label}>이메일</span>
          <input type="email" className={styles.input} placeholder="you@example.com" />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>비밀번호</span>
          <input type="password" className={styles.input} placeholder="••••••••" />
        </label>

        <Button type="submit" variant="primary" className={styles.submit}>
          로그인
        </Button>
      </form>
    </div>
  );
}
