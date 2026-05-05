export type Role = "admin" | "member";
export type TaskStatus = "todo" | "in_progress" | "done";

export interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  CLIENT_ORIGINS: string[];
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  DB_FILE: string;
}

export interface PaginationQuery {
  page: number;
  pageSize: number;
}

export interface PaginationMeta extends PaginationQuery {
  totalItems: number;
  totalPages: number;
}

export interface AuthTokenPayload {
  sub: number;
  role: Role;
  sessionVersion: number;
  iat?: number;
  exp?: number;
}

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: Role;
  sessionVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  sessionVersion: number;
}

export interface ProjectSummary {
  id: number;
  name: string;
  description: string;
  ownerId: number;
  ownerName: string;
  memberCount: number;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: number;
  name: string;
  email: string;
  role: Role;
  joinedAt: string;
}

export interface TaskItem {
  id: number;
  projectId: number;
  projectName: string;
  title: string;
  description: string;
  deadline: string | null;
  status: TaskStatus;
  assigneeId: number | null;
  assigneeName: string | null;
  createdBy: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
}

export interface TaskFilters extends PaginationQuery {
  status?: TaskStatus;
  projectId?: number;
  assigneeId?: number;
  search?: string;
}
