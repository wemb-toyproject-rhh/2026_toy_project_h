import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../context/ProjectContext.jsx";
import Button from "../components/common/Button.jsx";
import Icon from "../components/common/Icon.jsx";
import styles from "./ProjectConnectPage.module.css";

const THUMB_VARIANTS = ["thumb0", "thumb1", "thumb2", "thumb3"];

export default function ProjectConnectPage() {
  const navigate = useNavigate();
  const { addProject, projects, currentProject, setCurrentProjectId } = useProjects();
  const [galleryOpen, setGalleryOpen] = useState(projects.length > 0);
  const [galleryQuery, setGalleryQuery] = useState("");

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(galleryQuery.trim().toLowerCase()),
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    addProject({
      name: formData.get("projectName")?.trim() || "새 프로젝트",
      host: formData.get("host")?.trim() ?? "",
      port: formData.get("port")?.trim() ?? "",
      dbname: formData.get("dbname")?.trim() ?? "",
    });
    navigate("/");
  };

  const openProject = (id) => {
    setCurrentProjectId(id);
    navigate("/");
  };

  return (
    <div className={styles.screen}>
      <div className={styles.layout}>
        <div className={styles.cardColumn}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => navigate(-1)}
            aria-label="이전으로"
            title="이전으로"
          >
            ←
          </button>

          <form className={styles.card} onSubmit={handleSubmit}>
            <span className={styles.brand}>RHH</span>
            <h1 className={styles.title}>프로젝트 연결</h1>
            <p className={styles.subtitle}>
              레노빗 DB 접속 정보를 입력하면 이력이 자동으로 쌓입니다
            </p>

            <label className={styles.field}>
              <span className={styles.label}>프로젝트 이름</span>
              <input type="text" name="projectName" className={styles.input} placeholder="예: 스마트 관제" />
            </label>

            <div className={styles.divider} />

            <div className={styles.row}>
              <label className={`${styles.field} ${styles.grow}`}>
                <span className={styles.label}>Host</span>
                <input type="text" name="host" className={styles.input} placeholder="10.23.131.39" />
              </label>
              <label className={`${styles.field} ${styles.portField}`}>
                <span className={styles.label}>Port</span>
                <input type="text" name="port" className={styles.input} placeholder="5434" />
              </label>
            </div>

            <label className={styles.field}>
              <span className={styles.label}>DB 이름</span>
              <input type="text" name="dbname" className={styles.input} placeholder="hjjo_local" />
            </label>

            <div className={styles.row}>
              <label className={`${styles.field} ${styles.grow}`}>
                <span className={styles.label}>계정</span>
                <input type="text" className={styles.input} placeholder="readonly_user" />
              </label>
              <label className={`${styles.field} ${styles.grow}`}>
                <span className={styles.label}>비밀번호</span>
                <input type="password" className={styles.input} placeholder="••••••••" />
              </label>
            </div>

            <Button type="submit" variant="primary" className={styles.submit}>
              프로젝트 연결
            </Button>
          </form>

          <button
            type="button"
            className={styles.galleryToggle}
            onClick={() => setGalleryOpen((open) => !open)}
            aria-label={galleryOpen ? "연결된 프로젝트 패널 접기" : "연결된 프로젝트 패널 펼치기"}
          >
            {galleryOpen ? "접기" : "연결된 프로젝트 보기"}
            <Icon
              name="chevron"
              size={11}
              className={`${styles.galleryToggleIcon} ${galleryOpen ? "" : styles.galleryToggleIconCollapsed}`}
            />
          </button>
        </div>

        <div className={`${styles.gallery} ${galleryOpen ? styles.galleryOpen : ""}`}>
          <div className={styles.galleryInner}>
            <div className={styles.galleryHeader}>
              <h2 className={styles.galleryTitle}>연결된 프로젝트</h2>
              <label className={styles.gallerySearch}>
                <Icon name="search" size={12} className={styles.gallerySearchIcon} />
                <input
                  type="text"
                  className={styles.gallerySearchInput}
                  placeholder="프로젝트 검색"
                  value={galleryQuery}
                  onChange={(e) => setGalleryQuery(e.target.value)}
                />
              </label>
            </div>

            {projects.length === 0 ? (
              <p className={styles.galleryEmpty}>아직 연결된 프로젝트가 없습니다.</p>
            ) : filteredProjects.length === 0 ? (
              <p className={styles.galleryEmpty}>검색 결과가 없습니다.</p>
            ) : (
              <div className={styles.galleryGrid}>
                {filteredProjects.map((project, index) => (
                  <button
                    key={project.id}
                    type="button"
                    className={`${styles.tile} ${project.id === currentProject?.id ? styles.tileActive : ""}`}
                    onClick={() => openProject(project.id)}
                  >
                    <span
                      className={`${styles.tileThumb} ${styles[THUMB_VARIANTS[index % THUMB_VARIANTS.length]]}`}
                    >
                      {project.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className={styles.tileFooter}>
                      <span className={styles.tileBody}>
                        <span className={styles.tileName}>{project.name}</span>
                        <span className={styles.tileMeta}>
                          {project.host}:{project.port} · {project.dbname}
                        </span>
                      </span>
                      <span className={styles.tileAvatar}>K</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
