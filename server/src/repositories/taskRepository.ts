import type Database from "better-sqlite3";
import type {
  DashboardSummary,
  PaginationMeta,
  Role,
  TaskFilters,
  TaskItem,
  TaskStatus
} from "../types/domain.js";
import { buildPaginationMeta } from "../utils/pagination.js";

interface TaskRow {
  id: number;
  project_id: number;
  project_name: string;
  title: string;
  description: string;
  deadline: string | null;
  status: TaskStatus;
  assignee_id: number | null;
  assignee_name: string | null;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

interface SummaryRow {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
  overdue_tasks: number;
}

const mapTask = (row: TaskRow): TaskItem => ({
  id: row.id,
  projectId: row.project_id,
  projectName: row.project_name,
  title: row.title,
  description: row.description,
  deadline: row.deadline,
  status: row.status,
  assigneeId: row.assignee_id,
  assigneeName: row.assignee_name,
  createdBy: row.created_by,
  createdByName: row.created_by_name,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const buildTaskConditions = (
  role: Role,
  userId: number,
  filters: Partial<Omit<TaskFilters, "page" | "pageSize">> = {}
) => {
  const clauses = [
    role === "admin"
      ? "1 = 1"
      : `EXISTS (
           SELECT 1
           FROM project_members pm
           WHERE pm.project_id = t.project_id AND pm.user_id = @viewerId
         )`
  ];
  const params: Record<string, unknown> = { viewerId: userId };

  if (filters.status) {
    clauses.push("t.status = @status");
    params.status = filters.status;
  }

  if (filters.projectId) {
    clauses.push("t.project_id = @projectId");
    params.projectId = filters.projectId;
  }

  if (filters.assigneeId) {
    clauses.push("t.assignee_id = @assigneeId");
    params.assigneeId = filters.assigneeId;
  }

  if (filters.search) {
    clauses.push("(lower(t.title) LIKE @search OR lower(t.description) LIKE @search)");
    params.search = `%${filters.search.toLowerCase()}%`;
  }

  return {
    whereSql: clauses.join(" AND "),
    params
  };
};

export const createTaskRepository = (db: Database.Database) => {
  const taskSelect = `
    SELECT
      t.id,
      t.project_id,
      p.name AS project_name,
      t.title,
      t.description,
      t.deadline,
      t.status,
      t.assignee_id,
      assignee.name AS assignee_name,
      t.created_by,
      creator.name AS created_by_name,
      t.created_at,
      t.updated_at
    FROM tasks t
    INNER JOIN projects p ON p.id = t.project_id
    INNER JOIN users creator ON creator.id = t.created_by
    LEFT JOIN users assignee ON assignee.id = t.assignee_id
  `;

  return {
    createTask(input: {
      projectId: number;
      title: string;
      description: string;
      deadline: string | null;
      status: TaskStatus;
      assigneeId: number | null;
      createdBy: number;
    }) {
      const result = db
        .prepare(
          `INSERT INTO tasks (project_id, title, description, deadline, status, assignee_id, created_by)
           VALUES (@projectId, @title, @description, @deadline, @status, @assigneeId, @createdBy)`
        )
        .run(input);

      return this.findTaskById(Number(result.lastInsertRowid));
    },

    findTaskById(taskId: number) {
      const row = db
        .prepare(`${taskSelect} WHERE t.id = ?`)
        .get(taskId) as TaskRow | undefined;

      return row ? mapTask(row) : null;
    },

    findAccessibleTask(taskId: number, userId: number, role: Role) {
      const { whereSql, params } = buildTaskConditions(role, userId);
      const row = db
        .prepare(`${taskSelect} WHERE t.id = @taskId AND ${whereSql}`)
        .get({ taskId, ...params }) as TaskRow | undefined;

      return row ? mapTask(row) : null;
    },

    listTasks(userId: number, role: Role, filters: TaskFilters) {
      const { whereSql, params } = buildTaskConditions(role, userId, filters);
      const offset = (filters.page - 1) * filters.pageSize;
      const rows = db
        .prepare(
          `${taskSelect}
           WHERE ${whereSql}
           ORDER BY
             CASE
               WHEN t.status != 'done' AND t.deadline IS NOT NULL AND t.deadline < strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
                 THEN 0
               ELSE 1
             END,
             CASE WHEN t.deadline IS NULL THEN 1 ELSE 0 END,
             t.deadline ASC,
             t.updated_at DESC
           LIMIT @limit OFFSET @offset`
        )
        .all({
          ...params,
          limit: filters.pageSize,
          offset
        }) as TaskRow[];

      const countRow = db
        .prepare(
          `SELECT COUNT(*) AS count
           FROM tasks t
           WHERE ${whereSql}`
        )
        .get(params) as { count: number };

      return {
        items: rows.map(mapTask),
        meta: buildPaginationMeta(filters.page, filters.pageSize, countRow.count)
      } as { items: TaskItem[]; meta: PaginationMeta };
    },

    updateTask(
      taskId: number,
      updates: Partial<{
        title: string;
        description: string;
        deadline: string | null;
        status: TaskStatus;
        assigneeId: number | null;
      }>
    ) {
      const fields: string[] = [];
      const params: Record<string, unknown> = { taskId };

      if (updates.title !== undefined) {
        fields.push("title = @title");
        params.title = updates.title;
      }

      if (updates.description !== undefined) {
        fields.push("description = @description");
        params.description = updates.description;
      }

      if (updates.deadline !== undefined) {
        fields.push("deadline = @deadline");
        params.deadline = updates.deadline;
      }

      if (updates.status !== undefined) {
        fields.push("status = @status");
        params.status = updates.status;
      }

      if (updates.assigneeId !== undefined) {
        fields.push("assignee_id = @assigneeId");
        params.assigneeId = updates.assigneeId;
      }

      if (!fields.length) {
        return this.findTaskById(taskId);
      }

      fields.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')");

      db.prepare(
        `UPDATE tasks
         SET ${fields.join(", ")}
         WHERE id = @taskId`
      ).run(params);

      return this.findTaskById(taskId);
    },

    deleteTask(taskId: number) {
      db.prepare("DELETE FROM tasks WHERE id = ?").run(taskId);
    },

    getDashboardSummary(
      userId: number,
      role: Role,
      filters: Partial<Omit<TaskFilters, "page" | "pageSize" | "status" | "search">>
    ) {
      const { whereSql, params } = buildTaskConditions(role, userId, filters);
      const row = db
        .prepare(
          `SELECT
             COUNT(*) AS total_tasks,
             SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) AS completed_tasks,
             SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) AS pending_tasks,
             SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_tasks,
             SUM(
               CASE
                 WHEN t.status != 'done'
                   AND t.deadline IS NOT NULL
                   AND t.deadline < strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
                 THEN 1
                 ELSE 0
               END
             ) AS overdue_tasks
           FROM tasks t
           WHERE ${whereSql}`
        )
        .get(params) as SummaryRow;

      return {
        totalTasks: row.total_tasks ?? 0,
        completedTasks: row.completed_tasks ?? 0,
        pendingTasks: row.pending_tasks ?? 0,
        inProgressTasks: row.in_progress_tasks ?? 0,
        overdueTasks: row.overdue_tasks ?? 0
      } satisfies DashboardSummary;
    }
  };
};
