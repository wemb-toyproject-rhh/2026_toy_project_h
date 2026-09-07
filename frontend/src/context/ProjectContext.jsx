import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import {
  fetchProjects,
  createProject,
  updateProject as updateProjectApi,
  deleteProject as deleteProjectApi,
  setRecentProject,
} from "../services/projectApi.js";

const ProjectContext = createContext(null);

// 백엔드 DTO(projectId/projectName/dbName) → 프론트에서 기존에 쓰던 필드명(id/name/dbname)으로 변환합니다.
function toProject(dto) {
  return {
    id: dto.projectId,
    name: dto.projectName,
    host: dto.host,
    port: String(dto.port),
    dbname: dto.dbName,
    account: dto.account,
  };
}

export function ProjectProvider({ children }) {
  const { token, logout, projectRecent, setProjectRecent } = useAuth();
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!token) {
      setProjects([]);
      setCurrentProjectId(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const rows = await fetchProjects(token);
      const mapped = rows.map(toProject);
      setProjects(mapped);
      setCurrentProjectId((prev) => {
        if (mapped.some((p) => p.id === prev)) return prev;
        if (mapped.some((p) => p.id === projectRecent)) return projectRecent;
        return mapped[0]?.id ?? null;
      });
    } catch (err) {
      if (err.status === 401) logout();
      else setError(err.message || "프로젝트 목록을 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, [token, logout, projectRecent]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // 프로젝트 전환/등록을 "최근 접속 프로젝트"로도 기록합니다. 부가 기능이라
  // 실패해도 화면 흐름은 막지 않고 콘솔에만 남깁니다.
  const rememberRecent = useCallback(
    (projectId) => {
      setRecentProject(token, projectId)
        .then(() => setProjectRecent(projectId))
        .catch((err) => console.warn("[최근 접속 프로젝트 저장 실패]", err.message));
    },
    [token, setProjectRecent],
  );

  const selectProject = useCallback(
    (projectId) => {
      setCurrentProjectId(projectId);
      rememberRecent(projectId);
    },
    [rememberRecent],
  );

  const addProject = useCallback(
    async (project) => {
      const dto = await createProject(token, {
        projectName: project.name,
        host: project.host,
        port: project.port,
        dbName: project.dbname,
        account: project.account,
        password: project.password,
      });
      const next = toProject(dto);
      setProjects((prev) => [next, ...prev]);
      setCurrentProjectId(next.id);
      rememberRecent(next.id);
      return next.id;
    },
    [token, rememberRecent],
  );

  const updateProject = useCallback(
    async (projectId, fields) => {
      const dto = await updateProjectApi(token, projectId, fields);
      const next = toProject(dto);
      setProjects((prev) => prev.map((project) => (project.id === projectId ? next : project)));
      return next;
    },
    [token],
  );

  const deleteProject = useCallback(
    async (projectId) => {
      await deleteProjectApi(token, projectId);
      setProjects((prev) => prev.filter((project) => project.id !== projectId));
      setCurrentProjectId((prev) => (prev === projectId ? null : prev));
    },
    [token],
  );

  const currentProject =
    projects.find((project) => project.id === currentProjectId) ?? projects[0] ?? null;

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        selectProject,
        addProject,
        updateProject,
        deleteProject,
        loading,
        error,
        refresh,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProjects must be used within a ProjectProvider");
  return ctx;
}
