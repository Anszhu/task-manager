import type { FastifyReply, FastifyRequest } from "fastify";
import { createTaskService } from "../services/taskService.js";
import type { TaskStatus } from "../types/domain.js";
import { sendSuccess } from "../utils/http.js";

interface TaskCreateBody {
  projectId: number;
  title: string;
  description?: string;
  deadline?: string | null;
  status?: TaskStatus;
  assigneeId?: number | null;
}

interface TaskUpdateBody {
  title?: string;
  description?: string;
  deadline?: string | null;
  status?: TaskStatus;
  assigneeId?: number | null;
}

interface TaskQuery {
  page?: number;
  pageSize?: number;
  status?: TaskStatus;
  projectId?: number;
  assigneeId?: number;
  search?: string;
}

interface TaskParams {
  id: number;
}

export const createTaskController = (taskService: ReturnType<typeof createTaskService>) => ({
  list: async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as TaskQuery;
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const result = taskService.listTasks(request.authUser!, {
      page,
      pageSize,
      status: query.status,
      projectId: query.projectId,
      assigneeId: query.assigneeId,
      search: query.search?.trim() || undefined
    });

    return sendSuccess(reply, 200, result.items, result.meta);
  },

  create: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(reply, 201, taskService.createTask(request.authUser!, request.body as TaskCreateBody)),

  update: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      200,
      taskService.updateTask(
        request.authUser!,
        (request.params as TaskParams).id,
        request.body as TaskUpdateBody
      )
    ),

  remove: async (request: FastifyRequest, reply: FastifyReply) => {
    taskService.deleteTask(request.authUser!, (request.params as TaskParams).id);
    return sendSuccess(reply, 200, { message: "Task deleted successfully." });
  }
});
