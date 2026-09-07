import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../context/ProjectContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { testConnection } from "../services/projectApi.js";
import Button from "../components/common/Button.jsx";
import Icon from "../components/common/Icon.jsx";
import styles from "./ProjectConnectPage.module.css";

export default function ProjectConnectPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { projects, currentProject, loading, selectProject, addProject, deleteProject } =
    useProjects();

  const formRef = useRef(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // null | "testing" | "ok" | "fail" — 접속 필드를 고치면 다시 테스트해야 하므로 초기화합니다.
  const [testState, setTestState] = useState(null);
  const [testMessage, setTestMessage] = useState("");
  const resetTestState = () => {
    setTestState(null);
    setTestMessage("");
  };

  const readConnectionFields = () => {
    const formData = new FormData(formRef.current);
    return {
      host: formData.get("host")?.trim() ?? "",
      port: formData.get("port")?.trim() ?? "",
      dbName: formData.get("dbname")?.trim() ?? "",
      account: formData.get("account")?.trim() ?? "",
      password: formData.get("password") ?? "",
    };
  };

  const handleTestConnection = async () => {
    setError("");
    setTestState("testing");
    setTestMessage("");
    try {
      const result = await testConnection(token, readConnectionFields());
      if (result.ok) {
        setTestState("ok");
        setTestMessage("연결에 성공했습니다");
      } else {
        setTestState("fail");
        setTestMessage(result.error || "연결에 실패했습니다");
      }
    } catch (err) {
      setTestState("fail");
      setTestMessage(err.message || "연결 테스트에 실패했습니다");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setError("");

    // 버튼이 비활성화돼 있어도 입력 필드에서 Enter를 누르면 폼 제출이 될 수 있어
    // 여기서도 한 번 더 막습니다 — 연결 테스트를 통과하지 않은 정보는 등록 자체가
    // 안 되게 합니다(서버도 같은 걸 다시 검증하지만, 등록 버튼 활성화 조건이기도 함).
    if (testState !== "ok") {
      setError("먼저 [연결 테스트]로 접속 가능한지 확인해 주세요");
      return;
    }

    const formData = new FormData(event.target);
    setSubmitting(true);
    try {
      await addProject({
        name: formData.get("projectName")?.trim() || "새 프로젝트",
        host: formData.get("host")?.trim() ?? "",
        port: formData.get("port")?.trim() ?? "",
        dbname: formData.get("dbname")?.trim() ?? "",
        account: formData.get("account")?.trim() ?? "",
        password: formData.get("password") ?? "",
      });
      navigate("/");
    } catch (err) {
      // 여기서 실패해도(=서버가 접속 재검증에 실패해도) 이미 만든 잘못된 프로젝트는
      // 없습니다 — 백엔드가 등록 자체를 거부하기 때문입니다.
      setError(err.message || "프로젝트 연결에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelect = (projectId) => {
    selectProject(projectId);
    navigate("/");
  };

  const handleDelete = async (event, projectId) => {
    event.stopPropagation();
    if (!window.confirm("이 프로젝트를 목록에서 삭제할까요?")) return;
    setDeletingId(projectId);
    try {
      await deleteProject(projectId);
    } catch (err) {
      setError(err.message || "프로젝트 삭제에 실패했습니다");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={styles.screen}>
      <div className={styles.layout}>
        <form className={styles.card} onSubmit={handleSubmit} ref={formRef}>
          <span className={styles.brand}>RHH</span>
          <h1 className={styles.title}>프로젝트 연결</h1>
          <p className={styles.subtitle}>
            레노빗 DB 접속 정보를 입력하면 이력이 자동으로 쌓입니다
          </p>

          {error && <p className={styles.error}>{error}</p>}

          <label className={styles.field}>
            <span className={styles.label}>프로젝트 이름</span>
            <input type="text" name="projectName" className={styles.input} placeholder="예: 스마트 관제" />
          </label>

          <div className={styles.divider} />

          <div className={styles.row}>
            <label className={`${styles.field} ${styles.grow}`}>
              <span className={styles.label}>Host</span>
              <input
                type="text"
                name="host"
                className={styles.input}
                placeholder="10.23.131.39"
                onChange={resetTestState}
              />
            </label>
            <label className={`${styles.field} ${styles.portField}`}>
              <span className={styles.label}>Port</span>
              <input
                type="text"
                name="port"
                className={styles.input}
                placeholder="5434"
                onChange={resetTestState}
              />
            </label>
          </div>

          <label className={styles.field}>
            <span className={styles.label}>DB 이름</span>
            <input
              type="text"
              name="dbname"
              className={styles.input}
              placeholder="hjjo_local"
              onChange={resetTestState}
            />
          </label>

          <div className={styles.row}>
            <label className={`${styles.field} ${styles.grow}`}>
              <span className={styles.label}>계정</span>
              <input
                type="text"
                name="account"
                className={styles.input}
                placeholder="readonly_user"
                onChange={resetTestState}
              />
            </label>
            <label className={`${styles.field} ${styles.grow}`}>
              <span className={styles.label}>비밀번호</span>
              <input
                type="password"
                name="password"
                className={styles.input}
                placeholder="••••••••"
                onChange={resetTestState}
              />
            </label>
          </div>

          <div className={styles.testRow}>
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={testState === "testing"}
              onClick={handleTestConnection}
            >
              {testState === "testing" ? "연결 확인 중..." : "연결 테스트"}
            </Button>
            {testState === "ok" && <span className={styles.testOk}>✓ {testMessage}</span>}
            {testState === "fail" && <span className={styles.testFail}>✕ {testMessage}</span>}
          </div>

          {testState !== "ok" && (
            <p className={styles.hint}>[연결 테스트]를 먼저 통과해야 프로젝트를 연결할 수 있습니다</p>
          )}

          <div className={styles.actions}>
            <Button type="button" variant="default" onClick={() => navigate(-1)}>
              취소
            </Button>
            <Button
              type="submit"
              variant="primary"
              className={styles.submit}
              disabled={submitting || testState !== "ok"}
            >
              {submitting ? "연결 중..." : "프로젝트 연결"}
            </Button>
          </div>
        </form>

        <aside className={`${styles.card} ${styles.listCard}`}>
          <h2 className={styles.listTitle}>등록된 프로젝트 목록</h2>

          {loading && projects.length === 0 ? (
            <p className={styles.empty}>불러오는 중...</p>
          ) : projects.length === 0 ? (
            <p className={styles.empty}>등록된 프로젝트가 없습니다</p>
          ) : (
            <ul className={styles.list}>
              {projects.map((project) => (
                <li
                  key={project.id}
                  className={`${styles.listItem} ${
                    project.id === currentProject?.id ? styles.active : ""
                  }`}
                >
                  <div className={styles.listItemInfo}>
                    <span className={styles.listItemName}>{project.name}</span>
                    <span className={styles.listItemMeta}>
                      {project.host}:{project.port} · {project.dbname}
                    </span>
                  </div>
                  <div className={styles.listItemActions}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelect(project.id)}
                    >
                      접속
                    </Button>
                    <Button
                      type="button"
                      variant="ghostDanger"
                      size="icon"
                      aria-label="프로젝트 삭제"
                      title="프로젝트 삭제"
                      disabled={deletingId === project.id}
                      onClick={(event) => handleDelete(event, project.id)}
                    >
                      <Icon name="trash" size={14} />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
