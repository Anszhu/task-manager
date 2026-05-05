import type { Task, TaskStatus } from "../types";
import { EmptyState } from "./EmptyState";
import { StatusBadge, statusLabel } from "./StatusBadge";

const editableStatuses: TaskStatus[] = ["todo", "in_progress", "done"];

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }).format(new Date(value))
    : "No deadline";

export const TaskTable = ({
  tasks,
  currentUserId,
  isAdmin,
  onStatusChange,
  onSelectTask,
  selectedTaskId
}: {
  tasks: Task[];
  currentUserId: number;
  isAdmin: boolean;
  onStatusChange: (task: Task, status: TaskStatus) => Promise<void>;
  onSelectTask?: (task: Task) => void;
  selectedTaskId?: number;
}) => {
  if (!tasks.length) {
    return (
      <EmptyState
        title="No tasks match this view"
        description="Try adjusting your filters or create a new task to populate the board."
      />
    );
  }

  return (
    <div className="task-table card">
      <table>
        <thead>
          <tr>
            <th>Task</th>
            <th>Project</th>
            <th>Assignee</th>
            <th>Deadline</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const canEditStatus = isAdmin || task.assigneeId === currentUserId;

            return (
              <tr
                key={task.id}
                className={selectedTaskId === task.id ? "selected-row" : undefined}
                onClick={() => onSelectTask?.(task)}
              >
                <td>
                  <div className="task-title-cell">
                    <strong>{task.title}</strong>
                    <span>{task.description || "No description provided."}</span>
                  </div>
                </td>
                <td>{task.projectName}</td>
                <td>{task.assigneeName ?? "Unassigned"}</td>
                <td>{formatDate(task.deadline)}</td>
                <td>
                  {canEditStatus ? (
                    <select
                      value={task.status}
                      aria-label={`Update status for ${task.title}`}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) =>
                        void onStatusChange(task, event.currentTarget.value as TaskStatus)
                      }
                    >
                      {editableStatuses.map((status) => (
                        <option key={status} value={status}>
                          {statusLabel[status]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <StatusBadge status={task.status} />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
