import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { createUserController } from "../controllers/userController.js";
import { userSearchSchema } from "../schemas/userSchemas.js";

export const registerUserRoutes = (
  app: FastifyInstance,
  controller: ReturnType<typeof createUserController>,
  authenticate: preHandlerHookHandler
) => {
  app.get("/users", { preHandler: authenticate, schema: userSearchSchema }, controller.search);
};
