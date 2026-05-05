import type { Project } from "../types";

export const ProjectCard = ({
  project,
  selected,
  onSelect
}: {
  project: Project;
  selected?: boolean;
  onSelect?: (project: Project) => void;
}) => (
  <button
    type="button"
    className={selected ? "project-card card selected" : "project-card card"}
    onClick={() => onSelect?.(project)}
  >
    <div className="project-card-head">
      <div>
        <p className="eyebrow">Project</p>
        <h3>{project.name}</h3>
      </div>
      <span className="owner-chip">{project.ownerName}</span>
    </div>
    <p>{project.description || "No project description yet."}</p>
    <div className="project-card-stats">
      <span>{project.memberCount} members</span>
      <span>{project.taskCount} tasks</span>
    </div>
  </button>
);
