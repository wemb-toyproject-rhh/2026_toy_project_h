import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/common/Button.jsx";
import PasswordInput from "../components/common/PasswordInput.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { register, login } from "../services/authApi.js";
import styles from "./SignupPage.module.css";

const PASSWORD_MIN = 4;

export default function SignupPage() {
  const navigate = useNavigate();
  const { login: setAuth } = useAuth();

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setError("");

    if (!userId.trim()) {
      setError("아이디를 입력해 주세요");
      return;
    }
    if (password.length < PASSWORD_MIN) {
      setError(`비밀번호는 최소 ${PASSWORD_MIN}자 이상이어야 합니다`);
      return;
    }
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다");
      return;
    }

    setSubmitting(true);
    try {
      await register(userId, password);
      // 가입 직후 바로 로그인시켜서, 방금 입력한 정보를 또 치게 하지 않습니다.
      // 새로 만든 계정은 프로젝트가 하나도 없으니 바로 연결 화면으로 보냅니다.
      const { token, userId: loggedInUserId } = await login(userId, password);
      setAuth(token, loggedInUserId, null);
      navigate("/connect");
    } catch (err) {
      setError(err.message || "회원가입에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.screen}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <span className={styles.brand}>RHH</span>
        <h1 className={styles.title}>회원가입</h1>
        <p className={styles.subtitle}>RENOBIT History Hub 계정을 만드세요</p>

        {error && <p className={styles.error}>{error}</p>}

        <label className={styles.field}>
          <span className={styles.label}>아이디</span>
          <input
            type="text"
            className={styles.input}
            placeholder="아이디를 입력하세요"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            autoComplete="username"
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>비밀번호</span>
          <PasswordInput
            className={styles.input}
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
          />
          <span className={styles.hint}>최소 {PASSWORD_MIN}자 이상</span>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>비밀번호 확인</span>
          <PasswordInput
            className={styles.input}
            placeholder="••••••••"
            value={passwordConfirm}
            onChange={(event) => setPasswordConfirm(event.target.value)}
            autoComplete="new-password"
          />
        </label>

        <Button type="submit" variant="primary" className={styles.submit} disabled={submitting}>
          {submitting ? "가입 중..." : "회원가입"}
        </Button>

        <p className={styles.switchLink}>
          이미 계정이 있으신가요?{" "}
          <button type="button" onClick={() => navigate("/login")}>
            로그인
          </button>
        </p>
      </form>
    </div>
  );
}
