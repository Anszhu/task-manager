import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { loadEnv } from "./config/env.js";
import { createDatabase } from "./db/database.js";
import { createAuthController } from "./controllers/authController.js";
import { createDashboardController } from "./controllers/dashboardController.js";
import { createProjectController } from "./controllers/projectController.js";
import { createTaskController } from "./controllers/taskController.js";
import { createUserController } from "./controllers/userController.js";
import { buildAuthenticate } from "./middleware/auth.js";
import { createProjectRepository } from "./repositories/projectRepository.js";
import { createTaskRepository } from "./repositories/taskRepository.js";
import { createUserRepository } from "./repositories/userRepository.js";
import { registerAuthRoutes } from "./routes/authRoutes.js";
import { registerDashboardRoutes } from "./routes/dashboardRoutes.js";
import { registerProjectRoutes } from "./routes/projectRoutes.js";
import { registerTaskRoutes } from "./routes/taskRoutes.js";
import { registerUserRoutes } from "./routes/userRoutes.js";
import { createAuthService } from "./services/authService.js";
import { createDashboardService } from "./services/dashboardService.js";
import { createProjectService } from "./services/projectService.js";
import { createTaskService } from "./services/taskService.js";
import { createUserService } from "./services/userService.js";
import { AppError, badRequest, notFound } from "./utils/errors.js";
import { handleError } from "./utils/http.js";
import type { EnvConfig } from "./types/domain.js";

export const createApp = (envOverrides: Partial<EnvConfig> = {}) => {
  const env = loadEnv(envOverrides);
  const db = createDatabase(env);
  const app = Fastify({ logger: env.NODE_ENV !== "test" });

  const userRepository = createUserRepository(db);
  const projectRepository = createProjectRepository(db);
  const taskRepository = createTaskRepository(db);

  const authService = createAuthService(userRepository, env);
  const userService = createUserService(userRepository);
  const projectService = createProjectService(projectRepository, userRepository);
  const taskService = createTaskService(taskRepository, projectRepository, userRepository);
  const dashboardService = createDashboardService(taskRepository);

  const authController = createAuthController(authService);
  const userController = createUserController(userService);
  const projectController = createProjectController(projectService);
  const taskController = createTaskController(taskService);
  const dashboardController = createDashboardController(dashboardService);

  const authenticate = buildAuthenticate(authService);

  app.addHook("onClose", async () => {
    db.close();
  });

  app.register(cors, {
    origin(origin, callback) {
      if (!origin || env.CLIENT_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed."), false);
    }
  });

  app.register(helmet, {
    contentSecurityPolicy:
      env.NODE_ENV === "production"
        ? {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", "data:"],
              scriptSrc: ["'self'"],
              connectSrc: ["'self'"],
              fontSrc: ["'self'", "data:"]
            }
          }
        : false
  });

  app.register(rateLimit, {
    max: 300,
    timeWindow: "1 minute"
  });

  app.get("/api/health", async () => ({
    success: true,
    data: {
      status: "ok"
    }
  }));

  app.register((api) => {
    registerAuthRoutes(api, authController, authenticate);
    registerUserRoutes(api, userController, authenticate);
    registerProjectRoutes(api, projectController, authenticate);
    registerTaskRoutes(api, taskController, authenticate);
    registerDashboardRoutes(api, dashboardController, authenticate);
  }, { prefix: "/api" });

  const currentFile = fileURLToPath(import.meta.url);
  const serverRoot = resolve(dirname(currentFile), "..");
  const webDist = resolve(serverRoot, "..", "web", "dist");

  if (existsSync(webDist)) {
    app.register(fastifyStatic, {
      root: webDist,
      prefix: "/"
    });
  }

  app.setErrorHandler((error, _request, reply) => {
    if ((error as { validation?: unknown }).validation) {
      return handleError(reply, badRequest("Validation failed.", (error as { validation: unknown }).validation));
    }

    if (error instanceof AppError) {
      return handleError(reply, error);
    }

    app.log.error(error);
    return handleError(reply, error);
  });

  app.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith("/api")) {
      return handleError(reply, notFound());
    }

    if (existsSync(webDist)) {
      return reply.sendFile("index.html");
    }

    return handleError(reply, notFound("Frontend build not found. Run the web build first."));
  });

  return app;
};
