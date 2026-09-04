import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../../context/ProjectContext.jsx";
import Icon from "./Icon.jsx";
import styles from "./ProjectSwitcher.module.css";

export default function ProjectSwitcher() {
  const { projects, currentProject, setCurrentProjectId } = useProjects();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.label}>프로젝트: {currentProject?.name}</span>
        <Icon name="chevron" size={10} className={styles.chevron} />
      </button>

      {open && (
        <div className={styles.panel}>
          {projects.map((project) => (
            <button
              key={project.id}
              type="button"
              className={`${styles.option} ${project.id === currentProject?.id ? styles.active : ""}`}
              onClick={() => {
                setCurrentProjectId(project.id);
                setOpen(false);
              }}
            >
              <span className={styles.optionName}>{project.name}</span>
              <span className={styles.optionMeta}>
                {project.host}:{project.port} · {project.dbname}
              </span>
            </button>
          ))}

          <div className={styles.divider} />

          <button
            type="button"
            className={styles.addOption}
            onClick={() => {
              setOpen(false);
              navigate("/connect");
            }}
          >
            + 새 프로젝트 연결
          </button>
        </div>
      )}
    </div>
  );
}
