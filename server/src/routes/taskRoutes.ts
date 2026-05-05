import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { createTaskController } from "../controllers/taskController.js";
import {
  createTaskSchema,
  listTaskSchema,
  taskIdSchema,
  updateTaskSchema
} from "../schemas/taskSchemas.js";

export const registerTaskRoutes = (
  app: FastifyInstance,
  controller: ReturnType<typeof createTaskController>,
  authenticate: preHandlerHookHandler
) => {
  app.get("/tasks", { preHandler: authenticate, schema: listTaskSchema }, controller.list);
  app.post("/tasks", { preHandler: authenticate, schema: createTaskSchema }, controller.create);
  app.patch("/tasks/:id", { preHandler: authenticate, schema: updateTaskSchema }, controller.update);
  app.delete("/tasks/:id", { preHandler: authenticate, schema: taskIdSchema }, controller.remove);
};
