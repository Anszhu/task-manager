import type Database from "better-sqlite3";
import type { ProjectMember, ProjectSummary, Role } from "../types/domain.js";

interface ProjectRow {
  id: number;
  name: string;
  description: string;
  owner_id: number;
  owner_name: string;
  member_count: number;
  task_count: number;
  created_at: string;
  updated_at: string;
}

interface ProjectMemberRow {
  id: number;
  name: string;
  email: string;
  role: Role;
  joined_at: string;
}

const mapProject = (row: ProjectRow): ProjectSummary => ({
  id: row.id,
  name: row.name,
  description: row.description,
  ownerId: row.owner_id,
  ownerName: row.owner_name,
  memberCount: row.member_count,
  taskCount: row.task_count,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapProjectMember = (row: ProjectMemberRow): ProjectMember => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  joinedAt: row.joined_at
});

export const createProjectRepository = (db: Database.Database) => {
  const projectSelect = `
    SELECT
      p.id,
      p.name,
      p.description,
      p.owner_id,
      owner.name AS owner_name,
      (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) AS member_count,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) AS task_count,
      p.created_at,
      p.updated_at
    FROM projects p
    INNER JOIN users owner ON owner.id = p.owner_id
  `;

  return {
    listAccessibleProjects(userId: number, role: Role) {
      const query =
        role === "admin"
          ? `${projectSelect} ORDER BY p.updated_at DESC, p.name ASC`
          : `${projectSelect}
             WHERE EXISTS (
               SELECT 1
               FROM project_members pm
               WHERE pm.project_id = p.id AND pm.user_id = @userId
             )
             ORDER BY p.updated_at DESC, p.name ASC`;
      const rows = db.prepare(query).all({ userId }) as ProjectRow[];
      return rows.map(mapProject);
    },

    createProject(input: { name: string; description: string; ownerId: number }) {
      const transaction = db.transaction((payload: typeof input) => {
        const insert = db.prepare(`
          INSERT INTO projects (name, description, owner_id)
          VALUES (@name, @description, @ownerId)
        `);
        const result = insert.run(payload);
        const projectId = Number(result.lastInsertRowid);

        db.prepare(
          `INSERT INTO project_members (project_id, user_id)
           VALUES (?, ?)`
        ).run(projectId, payload.ownerId);

        return projectId;
      });

      const projectId = transaction(input);
      return this.findProjectById(projectId);
    },

    findProjectById(projectId: number) {
      const row = db
        .prepare(`${projectSelect} WHERE p.id = ?`)
        .get(projectId) as ProjectRow | undefined;

      return row ? mapProject(row) : null;
    },

    findAccessibleProject(projectId: number, userId: number, role: Role) {
      const query =
        role === "admin"
          ? `${projectSelect} WHERE p.id = @projectId`
          : `${projectSelect}
             WHERE p.id = @projectId
               AND EXISTS (
                 SELECT 1
                 FROM project_members pm
                 WHERE pm.project_id = p.id AND pm.user_id = @userId
               )`;
      const row = db.prepare(query).get({ projectId, userId }) as ProjectRow | undefined;
      return row ? mapProject(row) : null;
    },

    listMembers(projectId: number) {
      const rows = db
        .prepare(
          `SELECT
             u.id,
             u.name,
             u.email,
             u.role,
             pm.created_at AS joined_at
           FROM project_members pm
           INNER JOIN users u ON u.id = pm.user_id
           WHERE pm.project_id = ?
           ORDER BY u.name ASC`
        )
        .all(projectId) as ProjectMemberRow[];

      return rows.map(mapProjectMember);
    },

    isMember(projectId: number, userId: number) {
      const row = db
        .prepare(
          `SELECT 1
           FROM project_members
           WHERE project_id = ? AND user_id = ?`
        )
        .get(projectId, userId) as { 1: number } | undefined;
      return Boolean(row);
    },

    addMember(projectId: number, userId: number) {
      db.prepare(
        `INSERT INTO project_members (project_id, user_id)
         VALUES (?, ?)`
      ).run(projectId, userId);
    },

    removeMember(projectId: number, userId: number) {
      const transaction = db.transaction(() => {
        db.prepare(
          `UPDATE tasks
           SET assignee_id = NULL,
               updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
           WHERE project_id = ? AND assignee_id = ?`
        ).run(projectId, userId);

        db.prepare(
          `DELETE FROM project_members
           WHERE project_id = ? AND user_id = ?`
        ).run(projectId, userId);
      });

      transaction();
    },

    deleteProject(projectId: number) {
      db.prepare("DELETE FROM projects WHERE id = ?").run(projectId);
    }
  };
};
