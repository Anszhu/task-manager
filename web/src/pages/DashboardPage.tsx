import { startTransition, useDeferredValue } from "preact/compat";
import { useEffect, useMemo, useState } from "preact/hooks";
import { apiRequest, ApiError } from "../api/client";
import { StatCard } from "../components/StatCard";
import { TaskTable } from "../components/TaskTable";
import { useAuth } from "../contexts/AuthContext";
import type { DashboardSummary, Project, Task, TaskStatus, User } from "../types";

const DashboardPage = () => {
  const { token, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "" as TaskStatus | "",
    projectId: "",
    assigneeId: "",
    search: ""
  });

  const deferredSearch = useDeferredValue(filters.search);

  const taskQuery = useMemo(() => {
    const params = new URLSearchParams({ page: "1", pageSize: "8" });

    if (filters.status) {
      params.set("status", filters.status);
    }

    if (filters.projectId) {
      params.set("projectId", filters.projectId);
    }

    if (filters.assigneeId) {
      params.set("assigneeId", filters.assigneeId);
    }

    if (deferredSearch.trim()) {
      params.set("search", deferredSearch.trim());
    }

    return params.toString();
  }, [deferredSearch, filters.assigneeId, filters.projectId, filters.status]);

  const summaryQuery = useMemo(() => {
    const params = new URLSearchParams();

    if (filters.projectId) {
      params.set("projectId", filters.projectId);
    }

    if (filters.assigneeId) {
      params.set("assigneeId", filters.assigneeId);
    }

    return params.toString();
  }, [filters.assigneeId, filters.projectId]);

  const loadReferenceData = async () => {
    const [projectsResult, usersResult] = await Promise.all([
      apiRequest<Project[]>("/projects", { token }),
      user?.role === "admin"
        ? apiRequest<User[]>("/users?limit=20", { token })
        : Promise.resolve({ data: [] as User[] })
    ]);

    setProjects(projectsResult.data);
    setUsers(usersResult.data);
  };

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const [summaryResult, tasksResult] = await Promise.all([
        apiRequest<DashboardSummary>(`/dashboard/summary${summaryQuery ? `?${summaryQuery}` : ""}`, {
          token
        }),
        apiRequest<Task[]>(`/tasks?${taskQuery}`, { token })
      ]);

      startTransition(() => {
        setSummary(summaryResult.data);
        setTasks(tasksResult.data);
      });
    } catch (loadError) {
      setError(
        loadError instanceof ApiError
          ? loadError.message
          : "We could not load the dashboard right now."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReferenceData();
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [summaryQuery, taskQuery]);

  const handleStatusChange = async (task: Task, status: TaskStatus) => {
    if (task.status === status) {
      return;
    }

    await apiRequest(`/tasks/${task.id}`, {
      method: "PATCH",
      token,
      body: { status }
    });
    await loadDashboard();
  };

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>Delivery dashboard</h2>
        </div>
        <p className="page-copy">
          Keep a clear view of what is moving, what is stuck, and where deadlines need attention.
        </p>
      </header>

      <div className="stats-grid">
        <StatCard label="Total tasks" value={summary.totalTasks} />
        <StatCard label="Completed" value={summary.completedTasks} tone="accent" />
        <StatCard label="In progress" value={summary.inProgressTasks} />
        <StatCard label="Overdue" value={summary.overdueTasks} tone="alert" />
      </div>

      <div className="card filter-grid">
        <label>
          Search tasks
          <input
            value={filters.search}
            onInput={(event) =>
              setFilters((current) => ({ ...current, search: event.currentTarget.value }))
            }
            placeholder="Search by title or description"
          />
        </label>

        <label>
          Status
          <select
            value={filters.status}
            onChange={(event) =>
              setFilters((current) => ({ ...current, status: event.currentTarget.value as TaskStatus | "" }))
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
              setFilters((current) => ({ ...current, projectId: event.currentTarget.value }))
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
              setFilters((current) => ({ ...current, assigneeId: event.currentTarget.value }))
            }
          >
            <option value="">All assignees</option>
            {(user?.role === "admin" ? users : [{ id: user!.id, name: user!.name, email: user!.email, role: user!.role }]).map(
              (person) => (
                <option key={person.id} value={String(person.id)}>
                  {person.name}
                </option>
              )
            )}
          </select>
        </label>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <div className="card loading-state">Loading dashboard...</div> : null}
      {!loading ? (
        <TaskTable
          tasks={tasks}
          currentUserId={user!.id}
          isAdmin={user!.role === "admin"}
          onStatusChange={handleStatusChange}
        />
      ) : null}
    </section>
  );
};

export default DashboardPage;
