import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useProjects } from "../context/ProjectContext.jsx";
import { changeNickname, changePassword } from "../services/authApi.js";
import Button from "../components/common/Button.jsx";
import BackLink from "../components/common/BackLink.jsx";
import PasswordInput from "../components/common/PasswordInput.jsx";
import styles from "./AccountSettingsPage.module.css";

const PASSWORD_MIN = 4;
const USER_NAME_MAX = 100;

export default function AccountSettingsPage() {
  const navigate = useNavigate();
  const { userId, userName, token, logout, setUserName } = useAuth();
  const { projects } = useProjects();
  const [nickname, setNickname] = useState(userName ?? "");
  const [nicknameError, setNicknameError] = useState("");
  const [nicknameSuccess, setNicknameSuccess] = useState(false);
  const [nicknameSubmitting, setNicknameSubmitting] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const handleNicknameSubmit = async (event) => {
    event.preventDefault();
    if (nicknameSubmitting) return;
    setNicknameError("");
    setNicknameSuccess(false);

    const trimmed = nickname.trim();
    if (trimmed.length > USER_NAME_MAX) {
      setNicknameError(`닉네임은 ${USER_NAME_MAX}자를 넘을 수 없습니다`);
      return;
    }

    setNicknameSubmitting(true);
    try {
      const { userName: saved } = await changeNickname(token, trimmed);
      setUserName(saved);
      setNickname(saved ?? "");
      setNicknameSuccess(true);
    } catch (err) {
      setNicknameError(err.message || "닉네임 변경에 실패했습니다");
    } finally {
      setNicknameSubmitting(false);
    }
  };

  const handlePasswordField = (field) => (event) => {
    setPasswordSuccess(false);
    setPasswordForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (passwordSubmitting) return;
    setPasswordError("");
    setPasswordSuccess(false);

    const { current, next, confirm } = passwordForm;
    if (!current || !next || !confirm) {
      setPasswordError("모든 필드를 입력해 주세요");
      return;
    }
    if (next.length < PASSWORD_MIN) {
      setPasswordError(`새 비밀번호는 최소 ${PASSWORD_MIN}자 이상이어야 합니다`);
      return;
    }
    if (next !== confirm) {
      setPasswordError("새 비밀번호가 일치하지 않습니다");
      return;
    }

    setPasswordSubmitting(true);
    try {
      await changePassword(token, current, next);
      setPasswordForm({ current: "", next: "", confirm: "" });
      setPasswordSuccess(true);
    } catch (err) {
      setPasswordError(err.message || "비밀번호 변경에 실패했습니다");
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className={styles.page}>
      <BackLink>이전 페이지</BackLink>
      <h1 className={styles.pageTitle}>계정 설정</h1>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>계정 정보</h2>
        <div className={styles.infoBlock}>
          <div className={styles.infoGrid}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>아이디</span>
              <span className={styles.infoValue}>{userId ?? "-"}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>연결된 프로젝트</span>
              <span className={styles.infoValue}>
                {projects.length > 0 ? `${projects.length}개` : "없음"}
              </span>
            </div>
          </div>

          <form className={styles.nicknameForm} onSubmit={handleNicknameSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>닉네임</span>
            <div className={styles.nicknameRow}>
              <input
                type="text"
                className={styles.input}
                placeholder="닉네임을 입력하세요"
                value={nickname}
                onChange={(event) => {
                  setNickname(event.target.value);
                  setNicknameSuccess(false);
                }}
                maxLength={USER_NAME_MAX}
              />
              <Button type="submit" variant="default" size="sm" disabled={nicknameSubmitting}>
                {nicknameSubmitting ? "저장 중..." : "저장"}
              </Button>
            </div>
          </label>
          {nicknameError && <p className={styles.error}>{nicknameError}</p>}
          {nicknameSuccess && <p className={styles.success}>닉네임이 저장되었습니다</p>}
          </form>
        </div>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="default"
            onClick={() => navigate("/connect", { state: { openGallery: true } })}
          >
            프로젝트 연결 관리
          </Button>
          <Button type="button" variant="default" onClick={handleLogout}>
            로그아웃
          </Button>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>비밀번호 변경</h2>
        <form className={styles.form} onSubmit={handlePasswordSubmit}>
          {passwordError && <p className={styles.error}>{passwordError}</p>}
          {passwordSuccess && <p className={styles.success}>비밀번호가 변경되었습니다</p>}
          <div className={styles.row}>
            <label className={`${styles.field} ${styles.grow}`}>
              <span className={styles.label}>현재 비밀번호</span>
              <PasswordInput
                className={styles.input}
                placeholder="••••••••"
                value={passwordForm.current}
                onChange={handlePasswordField("current")}
                autoComplete="current-password"
              />
            </label>
            <label className={`${styles.field} ${styles.grow}`}>
              <span className={styles.label}>새 비밀번호</span>
              <PasswordInput
                className={styles.input}
                placeholder="••••••••"
                value={passwordForm.next}
                onChange={handlePasswordField("next")}
                autoComplete="new-password"
              />
            </label>
            <label className={`${styles.field} ${styles.grow}`}>
              <span className={styles.label}>새 비밀번호 확인</span>
              <PasswordInput
                className={styles.input}
                placeholder="••••••••"
                value={passwordForm.confirm}
                onChange={handlePasswordField("confirm")}
                autoComplete="new-password"
              />
            </label>
          </div>

          <div className={styles.formFooter}>
            <Button type="submit" variant="primary" disabled={passwordSubmitting}>
              {passwordSubmitting ? "변경 중..." : "변경하기"}
            </Button>
          </div>
        </form>
      </section>

      <section className={`${styles.card} ${styles.dangerCard}`}>
        <div className={styles.dangerRow}>
          <div>
            <h2 className={styles.sectionTitle}>계정 삭제</h2>
            <p className={styles.dangerText}>
              계정을 삭제하면 연결된 프로젝트 정보가 모두 사라지며 되돌릴 수 없습니다.
            </p>
            <p className={styles.hint}>계정 삭제 API가 아직 준비되지 않았습니다</p>
          </div>
          <Button type="button" variant="danger" disabled title="백엔드 API 준비 중">
            계정 삭제
          </Button>
        </div>
      </section>
    </div>
  );
}
