import { createContext, useContext, useState } from "react";

const INITIAL_PROJECTS = [
  { id: "proj-1", name: "스마트 관제 (main)", host: "10.23.131.39", port: "5434", dbname: "hjjo_local" },
];

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [currentProjectId, setCurrentProjectId] = useState(INITIAL_PROJECTS[0].id);

  const addProject = (project) => {
    const id = `proj-${Date.now()}`;
    setProjects((prev) => [...prev, { id, ...project }]);
    setCurrentProjectId(id);
    return id;
  };

  const currentProject =
    projects.find((project) => project.id === currentProjectId) ?? projects[0];

  return (
    <ProjectContext.Provider
      value={{ projects, currentProject, setCurrentProjectId, addProject }}
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
