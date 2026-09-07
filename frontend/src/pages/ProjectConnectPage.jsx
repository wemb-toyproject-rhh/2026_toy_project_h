import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useProjects } from "../context/ProjectContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { testConnection } from "../services/projectApi.js";
import Button from "../components/common/Button.jsx";
import Icon from "../components/common/Icon.jsx";
import PasswordInput from "../components/common/PasswordInput.jsx";
import EditableTitle from "../components/common/EditableTitle.jsx";
import styles from "./ProjectConnectPage.module.css";

const GALLERY_GRADIENTS = [
  "linear-gradient(135deg, #6366f1, #a855f7)",
  "linear-gradient(135deg, #06b6d4, #3b82f6)",
  "linear-gradient(135deg, #f59e0b, #ef4444)",
  "linear-gradient(135deg, #10b981, #06b6d4)",
  "linear-gradient(135deg, #ec4899, #8b5cf6)",
  "linear-gradient(135deg, #f43f5e, #f59e0b)",
];

function gradientForProject(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return GALLERY_GRADIENTS[hash % GALLERY_GRADIENTS.length];
}

export default function ProjectConnectPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const { projects, currentProject, loading, selectProject, addProject, renameProject, deleteProject } =
    useProjects();

  // 어디서 들어왔는지에 따라 갤러리 초기 상태를 명시적으로 지정할 수 있습니다
  // (헤더의 "+ 새 프로젝트 연결" → 접힘, 계정 설정의 "프로젝트 연결 관리" → 펼침).
  // 지정이 없으면(그냥 /connect로 들어온 경우) 아래 자동 펼침 로직을 따릅니다.
  const forcedGalleryOpen = location.state?.openGallery;

  const formRef = useRef(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [galleryOpen, setGalleryOpen] = useState(forcedGalleryOpen === true);
  const [galleryQuery, setGalleryQuery] = useState("");
  const autoOpenedRef = useRef(false);
  const hasFetchedRef = useRef(false);

  // 연결된 프로젝트가 있으면 처음 진입 시 갤러리를 자동으로 펼쳐줍니다. loading이
  // true였다가 false로 돌아오는 시점(=목록 요청이 실제로 한 번 끝난 시점)을 기다려서
  // 판단하고, 이후 사용자가 직접 접어도 다시 안 펼쳐지게 딱 한 번만 적용합니다.
  // 진입 경로가 갤러리 상태를 명시했다면(forcedGalleryOpen) 이 자동 판단은 건너뜁니다.
  useEffect(() => {
    if (loading) hasFetchedRef.current = true;
  }, [loading]);

  useEffect(() => {
    if (forcedGalleryOpen !== undefined) return;
    if (autoOpenedRef.current || loading || !hasFetchedRef.current) return;
    autoOpenedRef.current = true;
    if (projects.length > 0) setGalleryOpen(true);
  }, [loading, projects.length, forcedGalleryOpen]);

  const filteredProjects = useMemo(() => {
    const query = galleryQuery.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter((project) => project.name.toLowerCase().includes(query));
  }, [projects, galleryQuery]);

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

  const handleRename = async (projectId, newName) => {
    try {
      await renameProject(projectId, newName);
    } catch (err) {
      setError(err.message || "프로젝트 이름 수정에 실패했습니다");
    }
  };

  const handleDelete = async (event, project) => {
    event.stopPropagation();
    if (!window.confirm(`"${project.name}" 연결을 끊으시겠어요?`)) return;
    setDeletingId(project.id);
    try {
      await deleteProject(project.id);
    } catch (err) {
      setError(err.message || "연결 끊기에 실패했습니다");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={styles.screen}>
      <div className={styles.layout}>
        <div className={styles.formColumn}>
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
                placeholder="192.168.0.10"
                onChange={resetTestState}
              />
            </label>
            <label className={`${styles.field} ${styles.portField}`}>
              <span className={styles.label}>Port</span>
              <input
                type="text"
                name="port"
                className={styles.input}
                placeholder="5432"
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
              placeholder="renobit"
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
              <PasswordInput
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

        <button
          type="button"
          className={styles.galleryToggle}
          aria-expanded={galleryOpen}
          onClick={() => setGalleryOpen((v) => !v)}
        >
          <Icon name="chevron" size={11} className={styles.galleryToggleIcon} />
          {galleryOpen ? "접기" : "연결된 프로젝트 보기"}
        </button>
        </div>

        <div className={`${styles.gallery} ${galleryOpen ? styles.galleryOpen : ""}`}>
          <div className={styles.galleryInner}>
            <div className={styles.galleryHeader}>
              <h2 className={styles.listTitle}>등록된 프로젝트</h2>
              <label className={styles.gallerySearch}>
                <Icon name="search" size={12} />
                <input
                  type="text"
                  placeholder="프로젝트 검색"
                  value={galleryQuery}
                  onChange={(event) => setGalleryQuery(event.target.value)}
                />
              </label>
            </div>

            {loading && projects.length === 0 ? (
              <p className={styles.empty}>불러오는 중...</p>
            ) : projects.length === 0 ? (
              <p className={styles.empty}>등록된 프로젝트가 없습니다</p>
            ) : filteredProjects.length === 0 ? (
              <p className={styles.empty}>검색 결과가 없습니다</p>
            ) : (
              <div className={styles.galleryGrid}>
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className={`${styles.tile} ${
                      project.id === currentProject?.id ? styles.tileActive : ""
                    }`}
                  >
                    <button
                      type="button"
                      className={styles.tileMain}
                      onClick={() => handleSelect(project.id)}
                    >
                      <div
                        className={styles.thumb}
                        style={{ background: gradientForProject(project.id) }}
                      >
                        <span className={styles.thumbInitial}>
                          {project.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </button>
                    <div className={styles.tileNameRow}>
                      <EditableTitle
                        value={project.name}
                        className={styles.tileName}
                        onSave={(newName) => handleRename(project.id, newName)}
                      />
                    </div>
                    <button
                      type="button"
                      className={styles.tileMetaBtn}
                      onClick={() => handleSelect(project.id)}
                    >
                      <span className={styles.tileMeta}>
                        {project.host}:{project.port}
                      </span>
                    </button>
                    <Button
                      type="button"
                      variant="ghostDanger"
                      size="icon"
                      className={styles.tileDelete}
                      aria-label="연결 끊기"
                      title="연결 끊기"
                      disabled={deletingId === project.id}
                      onClick={(event) => handleDelete(event, project)}
                    >
                      <Icon name="trash" size={12} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
