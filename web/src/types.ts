export type Role = "admin" | "member";
export type TaskStatus = "todo" | "in_progress" | "done";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface Project {
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

export interface Task {
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

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
