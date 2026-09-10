import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../components/common/Button.jsx";
import PasswordInput from "../components/common/PasswordInput.jsx";
import { resetPassword } from "../services/authApi.js";
import styles from "./ResetPasswordPage.module.css";

const PASSWORD_MIN = 4;

// 본인 확인(인증) 절차가 아직 없는 임시 버전이라 아이디만 맞으면 비밀번호가
// 바뀝니다 — 나중에 인증 단계가 추가되면 이 화면에 그 단계만 끼워 넣으면 됩니다.
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [userId, setUserId] = useState(location.state?.userId ?? "");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

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
      await resetPassword(userId.trim(), password);
      setDone(true);
    } catch (err) {
      setError(err.message || "비밀번호 변경에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className={styles.screen}>
        <div className={styles.card}>
          <span className={styles.brand}>RHH</span>
          <h1 className={styles.title}>비밀번호가 변경되었습니다</h1>
          <p className={styles.subtitle}>새 비밀번호로 다시 로그인해 주세요</p>
          <Button
            type="button"
            variant="primary"
            className={styles.submit}
            onClick={() => navigate("/login")}
          >
            로그인하러 가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <span className={styles.brand}>RHH</span>
        <h1 className={styles.title}>비밀번호 변경</h1>
        <p className={styles.subtitle}>아이디를 확인하고 새 비밀번호를 입력하세요</p>

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
          <span className={styles.label}>새 비밀번호</span>
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
          <span className={styles.label}>새 비밀번호 확인</span>
          <PasswordInput
            className={styles.input}
            placeholder="••••••••"
            value={passwordConfirm}
            onChange={(event) => setPasswordConfirm(event.target.value)}
            autoComplete="new-password"
          />
        </label>

        <Button type="submit" variant="primary" className={styles.submit} disabled={submitting}>
          {submitting ? "변경 중..." : "비밀번호 변경"}
        </Button>

        <p className={styles.switchLink}>
          <button type="button" onClick={() => navigate("/login")}>
            로그인으로 돌아가기
          </button>
        </p>
      </form>
    </div>
  );
}
