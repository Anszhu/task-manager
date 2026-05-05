import { createProjectRepository } from "../repositories/projectRepository.js";
import { createTaskRepository } from "../repositories/taskRepository.js";
import { createUserRepository } from "../repositories/userRepository.js";
import type { AuthenticatedUser, TaskFilters, TaskStatus } from "../types/domain.js";
import { conflict, forbidden, notFound } from "../utils/errors.js";

const sanitizeText = (value: string) => value.trim().replace(/\s+/g, " ");

const normalizeDeadline = (value?: string | null) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw conflict("Deadline must be a valid date.");
  }

  return parsed.toISOString();
};

const validStatuses = new Set<TaskStatus>(["todo", "in_progress", "done"]);

export const createTaskService = (
  taskRepository: ReturnType<typeof createTaskRepository>,
  projectRepository: ReturnType<typeof createProjectRepository>,
  userRepository: ReturnType<typeof createUserRepository>
) => ({
  listTasks(viewer: AuthenticatedUser, filters: TaskFilters) {
    return taskRepository.listTasks(viewer.id, viewer.role, filters);
  },

  createTask(
    viewer: AuthenticatedUser,
    input: {
      projectId: number;
      title: string;
      description?: string;
      deadline?: string | null;
      status?: TaskStatus;
      assigneeId?: number | null;
    }
  ) {
    if (viewer.role !== "admin") {
      throw forbidden();
    }

    const project = projectRepository.findProjectById(input.projectId);
    if (!project) {
      throw notFound("Project not found.");
    }

    const title = sanitizeText(input.title);
    if (title.length < 2) {
      throw conflict("Task title must be at least 2 characters long.");
    }

    const description = input.description?.trim() ?? "";
    const deadline = normalizeDeadline(input.deadline);
    const status = input.status ?? "todo";

    if (!validStatuses.has(status)) {
      throw conflict("Task status is invalid.");
    }

    let assigneeId = input.assigneeId ?? null;
    if (assigneeId !== null) {
      const assignee = userRepository.findById(assigneeId);
      if (!assignee) {
        throw notFound("Assignee not found.");
      }

      if (!projectRepository.isMember(input.projectId, assigneeId)) {
        throw conflict("Assignee must be a member of the selected project.");
      }
    }

    return taskRepository.createTask({
      projectId: input.projectId,
      title,
      description,
      deadline: deadline ?? null,
      status,
      assigneeId,
      createdBy: viewer.id
    });
  },

  updateTask(
    viewer: AuthenticatedUser,
    taskId: number,
    updates: Partial<{
      title: string;
      description: string;
      deadline: string | null;
      status: TaskStatus;
      assigneeId: number | null;
    }>
  ) {
    const existingTask = taskRepository.findAccessibleTask(taskId, viewer.id, viewer.role);
    if (!existingTask) {
      throw notFound("Task not found.");
    }

    if (viewer.role === "member") {
      if (existingTask.assigneeId !== viewer.id) {
        throw forbidden("Members can only update tasks assigned to them.");
      }

      const invalidFields = ["title", "description", "deadline", "assigneeId"].filter(
        (field) => field in updates && updates[field as keyof typeof updates] !== undefined
      );

      if (invalidFields.length > 0) {
        throw forbidden("Members can only update task status.");
      }

      if (!updates.status || !validStatuses.has(updates.status)) {
        throw conflict("Task status is invalid.");
      }

      return taskRepository.updateTask(taskId, { status: updates.status });
    }

    const payload: Partial<{
      title: string;
      description: string;
      deadline: string | null;
      status: TaskStatus;
      assigneeId: number | null;
    }> = {};

    if (updates.title !== undefined) {
      const title = sanitizeText(updates.title);
      if (title.length < 2) {
        throw conflict("Task title must be at least 2 characters long.");
      }

      payload.title = title;
    }

    if (updates.description !== undefined) {
      payload.description = updates.description.trim();
    }

    if (updates.deadline !== undefined) {
      payload.deadline = normalizeDeadline(updates.deadline) ?? null;
    }

    if (updates.status !== undefined) {
      if (!validStatuses.has(updates.status)) {
        throw conflict("Task status is invalid.");
      }

      payload.status = updates.status;
    }

    if (updates.assigneeId !== undefined) {
      if (updates.assigneeId === null) {
        payload.assigneeId = null;
      } else {
        const assignee = userRepository.findById(updates.assigneeId);
        if (!assignee) {
          throw notFound("Assignee not found.");
        }

        if (!projectRepository.isMember(existingTask.projectId, updates.assigneeId)) {
          throw conflict("Assignee must be a member of the task's project.");
        }

        payload.assigneeId = updates.assigneeId;
      }
    }

    return taskRepository.updateTask(taskId, payload);
  },

  deleteTask(viewer: AuthenticatedUser, taskId: number) {
    if (viewer.role !== "admin") {
      throw forbidden();
    }

    const task = taskRepository.findTaskById(taskId);
    if (!task) {
      throw notFound("Task not found.");
    }

    taskRepository.deleteTask(taskId);
  }
});
