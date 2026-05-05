import type { TaskStatus } from "../types";

export const statusLabel: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done"
};

export const StatusBadge = ({ status }: { status: TaskStatus }) => (
  <span className={`status-badge ${status}`}>{statusLabel[status]}</span>
);
