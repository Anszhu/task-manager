import { useEffect, useMemo, useState } from "preact/hooks";
import { apiRequest, ApiError } from "../api/client";
import { EmptyState } from "../components/EmptyState";
import { ProjectCard } from "../components/ProjectCard";
import { useAuth } from "../contexts/AuthContext";
import type { Project, ProjectMember, User } from "../types";

const ProjectsPage = () => {
  const { token, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [candidateUsers, setCandidateUsers] = useState<User[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [newProject, setNewProject] = useState({ name: "", description: "" });
  const [newMemberId, setNewMemberId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const loadProjects = async () => {
    const { data } = await apiRequest<Project[]>("/projects", { token });
    setProjects(data);
    setSelectedProjectId((current) => current ?? data[0]?.id ?? null);
  };

  const loadMembers = async (projectId: number) => {
    const { data } = await apiRequest<ProjectMember[]>(`/projects/${projectId}/members`, { token });
    setMembers(data);
  };

  const loadCandidates = async (query: string) => {
    if (user?.role !== "admin") {
      return;
    }

    const { data } = await apiRequest<User[]>(
      `/users?limit=20&query=${encodeURIComponent(query)}`,
      { token }
    );
    setCandidateUsers(data);
  };

  useEffect(() => {
    setLoading(true);
    setError("");

    Promise.all([loadProjects(), user?.role === "admin" ? loadCandidates("") : Promise.resolve()])
      .catch((loadError) =>
        setError(
          loadError instanceof ApiError
            ? loadError.message
            : "Projects could not be loaded right now."
        )
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      setMembers([]);
      return;
    }

    void loadMembers(selectedProjectId).catch((loadError) =>
      setError(
        loadError instanceof ApiError ? loadError.message : "Project members could not be loaded."
      )
    );
  }, [selectedProjectId]);

  useEffect(() => {
    if (user?.role !== "admin") {
      return;
    }

    const timer = window.setTimeout(() => {
      void loadCandidates(memberSearch);
    }, 200);

    return () => window.clearTimeout(timer);
  }, [memberSearch]);

  const handleCreateProject = async (event: Event) => {
    event.preventDefault();
    setError("");

    try {
      await apiRequest("/projects", {
        method: "POST",
        token,
        body: newProject
      });
      setNewProject({ name: "", description: "" });
      await loadProjects();
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : "The project could not be created."
      );
    }
  };

  const handleAddMember = async (event: Event) => {
    event.preventDefault();

    if (!selectedProjectId || !newMemberId) {
      return;
    }

    try {
      await apiRequest(`/projects/${selectedProjectId}/members`, {
        method: "POST",
        token,
        body: { userId: Number(newMemberId) }
      });
      setNewMemberId("");
      await Promise.all([loadMembers(selectedProjectId), loadProjects()]);
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : "The member could not be added."
      );
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!selectedProjectId) {
      return;
    }

    try {
      await apiRequest(`/projects/${selectedProjectId}/members/${memberId}`, {
        method: "DELETE",
        token
      });
      await Promise.all([loadMembers(selectedProjectId), loadProjects()]);
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : "The member could not be removed."
      );
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProjectId || !window.confirm("Delete this project and all of its tasks?")) {
      return;
    }

    try {
      await apiRequest(`/projects/${selectedProjectId}`, {
        method: "DELETE",
        token
      });
      await loadProjects();
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : "The project could not be deleted."
      );
    }
  };

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Projects</p>
          <h2>Manage team spaces</h2>
        </div>
        <p className="page-copy">
          Create focused projects, assign the right members, and keep ownership visible.
        </p>
      </header>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="two-column-layout">
        <div className="page-stack">
          {user?.role === "admin" ? (
            <form className="card form-grid" onSubmit={(event) => void handleCreateProject(event)}>
              <div className="section-head">
                <h3>Create project</h3>
                <p>Admins can launch new workspaces in seconds.</p>
              </div>

              <label>
                Project name
                <input
                  value={newProject.name}
                  onInput={(event) =>
                    setNewProject((current) => ({ ...current, name: event.currentTarget.value }))
                  }
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  value={newProject.description}
                  onInput={(event) =>
                    setNewProject((current) => ({
                      ...current,
                      description: event.currentTarget.value
                    }))
                  }
                  rows={4}
                />
              </label>

              <button className="primary-button" type="submit">
                Create project
              </button>
            </form>
          ) : null}

          <div className="project-list">
            {loading ? <div className="card loading-state">Loading projects...</div> : null}
            {!loading && projects.length === 0 ? (
              <EmptyState
                title="No projects yet"
                description="Create a project as an admin to start assigning work."
              />
            ) : null}
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                selected={project.id === selectedProjectId}
                onSelect={(selected) => setSelectedProjectId(selected.id)}
              />
            ))}
          </div>
        </div>

        <div className="page-stack">
          {selectedProject ? (
            <div className="card detail-panel">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Selected project</p>
                  <h3>{selectedProject.name}</h3>
                </div>
                {user?.role === "admin" ? (
                  <button className="danger-button" type="button" onClick={() => void handleDeleteProject()}>
                    Delete project
                  </button>
                ) : null}
              </div>

              <p>{selectedProject.description || "No description provided yet."}</p>

              <div className="mini-stats">
                <span>{selectedProject.memberCount} members</span>
                <span>{selectedProject.taskCount} tasks</span>
                <span>Owner: {selectedProject.ownerName}</span>
              </div>

              {user?.role === "admin" ? (
                <form className="inline-form" onSubmit={(event) => void handleAddMember(event)}>
                  <label>
                    Search people
                    <input
                      value={memberSearch}
                      onInput={(event) => setMemberSearch(event.currentTarget.value)}
                      placeholder="Search by name or email"
                    />
                  </label>

                  <label>
                    Add member
                    <select
                      value={newMemberId}
                      onChange={(event) => setNewMemberId(event.currentTarget.value)}
                    >
                      <option value="">Choose a user</option>
                      {candidateUsers
                        .filter((candidate) => !members.some((member) => member.id === candidate.id))
                        .map((candidate) => (
                          <option key={candidate.id} value={String(candidate.id)}>
                            {candidate.name} ({candidate.email})
                          </option>
                        ))}
                    </select>
                  </label>

                  <button className="primary-button" type="submit">
                    Add member
                  </button>
                </form>
              ) : null}

              <div className="member-list">
                {members.map((member) => (
                  <div key={member.id} className="member-row">
                    <div>
                      <strong>{member.name}</strong>
                      <span>
                        {member.email} • {member.role}
                      </span>
                    </div>
                    {user?.role === "admin" && member.id !== selectedProject.ownerId ? (
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => void handleRemoveMember(member.id)}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              title="Select a project"
              description="Choose a project to review its members and ownership details."
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default ProjectsPage;
