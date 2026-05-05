import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { createProjectController } from "../controllers/projectController.js";
import {
  addMemberSchema,
  createProjectSchema,
  projectIdSchema,
  removeMemberSchema
} from "../schemas/projectSchemas.js";

export const registerProjectRoutes = (
  app: FastifyInstance,
  controller: ReturnType<typeof createProjectController>,
  authenticate: preHandlerHookHandler
) => {
  app.get("/projects", { preHandler: authenticate }, controller.list);
  app.post("/projects", { preHandler: authenticate, schema: createProjectSchema }, controller.create);
  app.get("/projects/:id", { preHandler: authenticate, schema: projectIdSchema }, controller.detail);
  app.delete("/projects/:id", { preHandler: authenticate, schema: projectIdSchema }, controller.remove);
  app.get("/projects/:id/members", { preHandler: authenticate, schema: projectIdSchema }, controller.members);
  app.post(
    "/projects/:id/members",
    { preHandler: authenticate, schema: addMemberSchema },
    controller.addMember
  );
  app.delete(
    "/projects/:id/members/:memberId",
    { preHandler: authenticate, schema: removeMemberSchema },
    controller.removeMember
  );
};
