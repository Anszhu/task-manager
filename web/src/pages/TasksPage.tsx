import { useEffect, useMemo, useState } from "preact/hooks";
import { apiRequest, ApiError } from "../api/client";
import { EmptyState } from "../components/EmptyState";
import { TaskTable } from "../components/TaskTable";
import { useAuth } from "../contexts/AuthContext";
import type { PaginationMeta, Project, ProjectMember, Task, TaskStatus, User } from "../types";

const emptyTaskForm = {
  projectId: "",
  title: "",
  description: "",
  deadline: "",
  status: "todo" as TaskStatus,
  assigneeId: ""
};

const TasksPage = () => {
  const { token, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [projectMembers, setProjectMembers] = useState<Record<number, ProjectMember[]>>({});
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [filters, setFilters] = useState({
    page: 1,
    status: "" as TaskStatus | "",
    projectId: "",
    assigneeId: ""
  });
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const activeAssigneeOptions = useMemo(() => {
    if (user?.role === "admin") {
      return users;
    }

    return user ? [user] : [];
  }, [user, users]);

  const createAssigneeOptions = useMemo(() => {
    if (!taskForm.projectId || user?.role !== "admin") {
      return [];
    }

    return projectMembers[Number(taskForm.projectId)] ?? [];
  }, [projectMembers, taskForm.projectId, user?.role]);

  const editAssigneeOptions = useMemo(() => {
    if (!selectedTask || user?.role !== "admin") {
      return [];
    }

    return projectMembers[selectedTask.projectId] ?? [];
  }, [projectMembers, selectedTask, user?.role]);

  const loadReferences = async () => {
    const [projectsResult, usersResult] = await Promise.all([
      apiRequest<Project[]>("/projects", { token }),
      user?.role === "admin"
        ? apiRequest<User[]>("/users?limit=30", { token })
        : Promise.resolve({ data: [] as User[] })
    ]);

    setProjects(projectsResult.data);
    setUsers(usersResult.data);
  };

  const loadTasks = async () => {
    const params = new URLSearchParams({
      page: String(filters.page),
      pageSize: "10"
    });

    if (filters.status) {
      params.set("status", filters.status);
    }

    if (filters.projectId) {
      params.set("projectId", filters.projectId);
    }

    if (filters.assigneeId) {
      params.set("assigneeId", filters.assigneeId);
    }

    const { data, meta: nextMeta } = await apiRequest<Task[]>(`/tasks?${params.toString()}`, {
      token
    });

    setTasks(data);
    setMeta(nextMeta ?? null);
  };

  const ensureProjectMembers = async (projectId: number) => {
    if (projectMembers[projectId] || user?.role !== "admin") {
      return;
    }

    const { data } = await apiRequest<ProjectMember[]>(`/projects/${projectId}/members`, {
      token
    });

    setProjectMembers((current) => ({
      ...current,
      [projectId]: data
    }));
  };

  useEffect(() => {
    setLoading(true);

    Promise.all([loadReferences(), loadTasks()])
      .catch((loadError) =>
        setError(
          loadError instanceof ApiError ? loadError.message : "Tasks could not be loaded."
        )
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void loadTasks().catch((loadError) =>
      setError(loadError instanceof ApiError ? loadError.message : "Tasks could not be loaded.")
    );
  }, [filters]);

  useEffect(() => {
    if (taskForm.projectId) {
      void ensureProjectMembers(Number(taskForm.projectId));
    }
  }, [taskForm.projectId]);

  useEffect(() => {
    if (selectedTask) {
      void ensureProjectMembers(selectedTask.projectId);
    }
  }, [selectedTask?.id]);

  const refresh = async () => {
    await loadTasks();
  };

  const handleCreateTask = async (event: Event) => {
    event.preventDefault();
    setError("");

    try {
      await apiRequest("/tasks", {
        method: "POST",
        token,
        body: {
          projectId: Number(taskForm.projectId),
          title: taskForm.title,
          description: taskForm.description,
          deadline: taskForm.deadline ? new Date(taskForm.deadline).toISOString() : null,
          status: taskForm.status,
          assigneeId: taskForm.assigneeId ? Number(taskForm.assigneeId) : null
        }
      });
      setTaskForm(emptyTaskForm);
      await refresh();
    } catch (submitError) {
      setError(
        submitError instanceof ApiError ? submitError.message : "The task could not be created."
      );
    }
  };

  const handleUpdateTask = async (event: Event) => {
    event.preventDefault();

    if (!selectedTask) {
      return;
    }

    try {
      await apiRequest(`/tasks/${selectedTask.id}`, {
        method: "PATCH",
        token,
        body: {
          title: selectedTask.title,
          description: selectedTask.description,
          deadline: selectedTask.deadline,
          status: selectedTask.status,
          assigneeId: selectedTask.assigneeId
        }
      });
      await refresh();
    } catch (submitError) {
      setError(
        submitError instanceof ApiError ? submitError.message : "The task could not be updated."
      );
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask || !window.confirm("Delete this task?")) {
      return;
    }

    try {
      await apiRequest(`/tasks/${selectedTask.id}`, {
        method: "DELETE",
        token
      });
      setSelectedTask(null);
      await refresh();
    } catch (submitError) {
      setError(
        submitError instanceof ApiError ? submitError.message : "The task could not be deleted."
      );
    }
  };

  const handleStatusChange = async (task: Task, status: TaskStatus) => {
    await apiRequest(`/tasks/${task.id}`, {
      method: "PATCH",
      token,
      body: { status }
    });
    await refresh();
  };

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Tasks</p>
          <h2>Assign work and keep it current</h2>
        </div>
        <p className="page-copy">
          Admins can shape the work queue, while members can keep their own delivery status up to
          date.
        </p>
      </header>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="card filter-grid">
        <label>
          Status
          <select
            value={filters.status}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                page: 1,
                status: event.currentTarget.value as TaskStatus | ""
              }))
            }
          >
            <option value="">All statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </label>

        <label>
          Project
          <select
            value={filters.projectId}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                page: 1,
                projectId: event.currentTarget.value
              }))
            }
          >
            <option value="">All projects</option>
            {projects.map((project) => (
              <option key={project.id} value={String(project.id)}>
                {project.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Assignee
          <select
            value={filters.assigneeId}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                page: 1,
                assigneeId: event.currentTarget.value
              }))
            }
          >
            <option value="">All assignees</option>
            {activeAssigneeOptions.map((person) => (
              <option key={person.id} value={String(person.id)}>
                {person.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="two-column-layout">
        <div className="page-stack">
          {loading ? <div className="card loading-state">Loading tasks...</div> : null}
          {!loading ? (
            <TaskTable
              tasks={tasks}
              currentUserId={user!.id}
              isAdmin={user!.role === "admin"}
              onStatusChange={handleStatusChange}
              onSelectTask={user!.role === "admin" ? setSelectedTask : undefined}
              selectedTaskId={selectedTask?.id}
            />
          ) : null}

          {meta ? (
            <div className="pagination-row">
              <button
                className="secondary-button"
                type="button"
                disabled={meta.page <= 1}
                onClick={() =>
                  setFilters((current) => ({ ...current, page: Math.max(1, current.page - 1) }))
                }
              >
                Previous
              </button>
              <span>
                Page {meta.page} of {meta.totalPages}
              </span>
              <button
                className="secondary-button"
                type="button"
                disabled={meta.page >= meta.totalPages}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: Math.min(meta.totalPages, current.page + 1)
                  }))
                }
              >
                Next
              </button>
            </div>
          ) : null}
        </div>

        <div className="page-stack">
          {user?.role === "admin" ? (
            <form className="card form-grid" onSubmit={(event) => void handleCreateTask(event)}>
              <div className="section-head">
                <h3>Create task</h3>
                <p>Assign work with deadlines and clear ownership.</p>
              </div>

              <label>
                Project
                <select
                  value={taskForm.projectId}
                  onChange={(event) =>
                    setTaskForm((current) => ({ ...current, projectId: event.currentTarget.value }))
                  }
                  required
                >
                  <option value="">Choose a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={String(project.id)}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Title
                <input
                  value={taskForm.title}
                  onInput={(event) =>
                    setTaskForm((current) => ({ ...current, title: event.currentTarget.value }))
                  }
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  value={taskForm.description}
                  onInput={(event) =>
                    setTaskForm((current) => ({
                      ...current,
                      description: event.currentTarget.value
                    }))
                  }
                  rows={4}
                />
              </label>

              <label>
                Deadline
                <input
                  value={taskForm.deadline}
                  onInput={(event) =>
                    setTaskForm((current) => ({ ...current, deadline: event.currentTarget.value }))
                  }
                  type="datetime-local"
                />
              </label>

              <label>
                Assignee
                <select
                  value={taskForm.assigneeId}
                  onChange={(event) =>
                    setTaskForm((current) => ({ ...current, assigneeId: event.currentTarget.value }))
                  }
                >
                  <option value="">Unassigned</option>
                  {createAssigneeOptions.map((person) => (
                    <option key={person.id} value={String(person.id)}>
                      {person.name}
                    </option>
                  ))}
                </select>
              </label>

              <button className="primary-button" type="submit">
                Create task
              </button>
            </form>
          ) : null}

          {user?.role === "admin" ? (
            selectedTask ? (
              <form className="card form-grid" onSubmit={(event) => void handleUpdateTask(event)}>
                <div className="section-head">
                  <h3>Edit task</h3>
                  <p>Refine details or transfer ownership without leaving the page.</p>
                </div>

                <label>
                  Title
                  <input
                    value={selectedTask.title}
                    onInput={(event) =>
                      setSelectedTask((current) =>
                        current ? { ...current, title: event.currentTarget.value } : current
                      )
                    }
                  />
                </label>

                <label>
                  Description
                  <textarea
                    value={selectedTask.description}
                    onInput={(event) =>
                      setSelectedTask((current) =>
                        current ? { ...current, description: event.currentTarget.value } : current
                      )
                    }
                    rows={4}
                  />
                </label>

                <label>
                  Deadline
                  <input
                    value={selectedTask.deadline ? selectedTask.deadline.slice(0, 16) : ""}
                    onInput={(event) =>
                      setSelectedTask((current) =>
                        current
                          ? {
                              ...current,
                              deadline: event.currentTarget.value
                                ? new Date(event.currentTarget.value).toISOString()
                                : null
                            }
                          : current
                      )
                    }
                    type="datetime-local"
                  />
                </label>

                <label>
                  Status
                  <select
                    value={selectedTask.status}
                    onChange={(event) =>
                      setSelectedTask((current) =>
                        current
                          ? { ...current, status: event.currentTarget.value as TaskStatus }
                          : current
                      )
                    }
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </label>

                <label>
                  Assignee
                  <select
                    value={selectedTask.assigneeId ? String(selectedTask.assigneeId) : ""}
                    onChange={(event) =>
                      setSelectedTask((current) =>
                        current
                          ? {
                              ...current,
                              assigneeId: event.currentTarget.value
                                ? Number(event.currentTarget.value)
                                : null
                            }
                          : current
                      )
                    }
                  >
                    <option value="">Unassigned</option>
                    {editAssigneeOptions.map((person) => (
                      <option key={person.id} value={String(person.id)}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="button-row">
                  <button className="primary-button" type="submit">
                    Save changes
                  </button>
                  <button className="danger-button" type="button" onClick={() => void handleDeleteTask()}>
                    Delete task
                  </button>
                </div>
              </form>
            ) : (
              <EmptyState
                title="Pick a task to edit"
                description="Select any row in the task table to update details or delete the task."
              />
            )
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default TasksPage;
