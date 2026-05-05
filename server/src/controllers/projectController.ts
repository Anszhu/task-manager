import type { FastifyReply, FastifyRequest } from "fastify";
import { createProjectService } from "../services/projectService.js";
import { sendSuccess } from "../utils/http.js";

interface ProjectBody {
  name: string;
  description?: string;
}

interface ProjectParams {
  id: number;
}

interface MemberBody {
  userId: number;
}

interface MemberParams extends ProjectParams {
  memberId: number;
}

export const createProjectController = (
  projectService: ReturnType<typeof createProjectService>
) => ({
  list: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(reply, 200, projectService.listProjects(request.authUser!)),

  create: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(reply, 201, projectService.createProject(request.authUser!, request.body as ProjectBody)),

  detail: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      200,
      projectService.getProject(request.authUser!, (request.params as ProjectParams).id)
    ),

  members: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      200,
      projectService.listMembers(request.authUser!, (request.params as ProjectParams).id)
    ),

  addMember: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      200,
      projectService.addMember(
        request.authUser!,
        (request.params as ProjectParams).id,
        (request.body as MemberBody).userId
      )
    ),

  removeMember: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(
      reply,
      200,
      projectService.removeMember(
        request.authUser!,
        (request.params as MemberParams).id,
        (request.params as MemberParams).memberId
      )
    ),

  remove: async (request: FastifyRequest, reply: FastifyReply) => {
    projectService.deleteProject(request.authUser!, (request.params as ProjectParams).id);
    return sendSuccess(reply, 200, { message: "Project deleted successfully." });
  }
});
