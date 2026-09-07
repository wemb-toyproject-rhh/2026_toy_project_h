import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useProjects } from "../context/ProjectContext.jsx";
import Button from "../components/common/Button.jsx";
import BackLink from "../components/common/BackLink.jsx";
import styles from "./AccountSettingsPage.module.css";

export default function AccountSettingsPage() {
  const navigate = useNavigate();
  const { userId, logout } = useAuth();
  const { projects } = useProjects();
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });

  const handlePasswordField = (field) => (event) =>
    setPasswordForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className={styles.page}>
      <BackLink>이전 페이지</BackLink>
      <h1 className={styles.pageTitle}>계정 설정</h1>

      <div className={styles.grid}>
        <div className={styles.column}>
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>계정 정보</h2>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>아이디</span>
              <span className={styles.infoValue}>{userId ?? "-"}</span>
            </div>
            <div className={styles.actions}>
              <Button type="button" variant="default" onClick={handleLogout}>
                로그아웃
              </Button>
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>연결된 프로젝트</h2>
            <p className={styles.projectSummary}>
              {projects.length > 0
                ? `${projects.length}개의 프로젝트가 연결되어 있습니다`
                : "연결된 프로젝트가 없습니다"}
            </p>
            <div className={styles.actions}>
              <Button
                type="button"
                variant="default"
                onClick={() => navigate("/connect", { state: { openGallery: true } })}
              >
                프로젝트 연결 관리
              </Button>
            </div>
          </section>
        </div>

        <div className={styles.column}>
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>비밀번호 변경</h2>
            <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
              <label className={styles.field}>
                <span className={styles.label}>현재 비밀번호</span>
                <input
                  type="password"
                  className={styles.input}
                  placeholder="••••••••"
                  value={passwordForm.current}
                  onChange={handlePasswordField("current")}
                  autoComplete="current-password"
                />
              </label>
              <div className={styles.row}>
                <label className={`${styles.field} ${styles.grow}`}>
                  <span className={styles.label}>새 비밀번호</span>
                  <input
                    type="password"
                    className={styles.input}
                    placeholder="••••••••"
                    value={passwordForm.next}
                    onChange={handlePasswordField("next")}
                    autoComplete="new-password"
                  />
                </label>
                <label className={`${styles.field} ${styles.grow}`}>
                  <span className={styles.label}>새 비밀번호 확인</span>
                  <input
                    type="password"
                    className={styles.input}
                    placeholder="••••••••"
                    value={passwordForm.confirm}
                    onChange={handlePasswordField("confirm")}
                    autoComplete="new-password"
                  />
                </label>
              </div>

              <p className={styles.hint}>비밀번호 변경 기능은 백엔드 API 준비 중이라 아직 저장되지 않습니다</p>

              <div className={styles.actions}>
                <Button type="submit" variant="primary" disabled title="백엔드 API 준비 중">
                  변경하기
                </Button>
              </div>
            </form>
          </section>

          <section className={`${styles.card} ${styles.dangerCard}`}>
            <h2 className={styles.sectionTitle}>계정 삭제</h2>
            <p className={styles.dangerText}>
              계정을 삭제하면 연결된 프로젝트 정보가 모두 사라지며 되돌릴 수 없습니다.
            </p>
            <p className={styles.hint}>계정 삭제 API가 아직 준비되지 않았습니다</p>
            <div className={styles.actions}>
              <Button type="button" variant="danger" disabled title="백엔드 API 준비 중">
                계정 삭제
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
