import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { createAuthController } from "../controllers/authController.js";
import { loginSchema, signupSchema } from "../schemas/authSchemas.js";

export const registerAuthRoutes = (
  app: FastifyInstance,
  controller: ReturnType<typeof createAuthController>,
  authenticate: preHandlerHookHandler
) => {
  app.post("/auth/signup", { schema: signupSchema, config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, controller.signup);
  app.post("/auth/login", { schema: loginSchema, config: { rateLimit: { max: 15, timeWindow: "1 minute" } } }, controller.login);
  app.get("/auth/me", { preHandler: authenticate }, controller.me);
  app.post("/auth/logout", { preHandler: authenticate }, controller.logout);
};
