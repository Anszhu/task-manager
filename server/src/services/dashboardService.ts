import { createTaskRepository } from "../repositories/taskRepository.js";
import type { AuthenticatedUser } from "../types/domain.js";

export const createDashboardService = (taskRepository: ReturnType<typeof createTaskRepository>) => ({
  getSummary(
    viewer: AuthenticatedUser,
    filters: {
      projectId?: number;
      assigneeId?: number;
    }
  ) {
    return taskRepository.getDashboardSummary(viewer.id, viewer.role, filters);
  }
});
