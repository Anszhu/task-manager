import type { FastifyReply, FastifyRequest } from "fastify";
import { createDashboardService } from "../services/dashboardService.js";
import { sendSuccess } from "../utils/http.js";

interface DashboardQuery {
  projectId?: number;
  assigneeId?: number;
}

export const createDashboardController = (
  dashboardService: ReturnType<typeof createDashboardService>
) => ({
  summary: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      200,
      dashboardService.getSummary(request.authUser!, {
        projectId: (request.query as DashboardQuery).projectId,
        assigneeId: (request.query as DashboardQuery).assigneeId
      })
    )
});
