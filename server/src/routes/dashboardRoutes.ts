import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { createDashboardController } from "../controllers/dashboardController.js";
import { dashboardSummarySchema } from "../schemas/dashboardSchemas.js";

export const registerDashboardRoutes = (
  app: FastifyInstance,
  controller: ReturnType<typeof createDashboardController>,
  authenticate: preHandlerHookHandler
) => {
  app.get(
    "/dashboard/summary",
    { preHandler: authenticate, schema: dashboardSummarySchema },
    controller.summary
  );
};
