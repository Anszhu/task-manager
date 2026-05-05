import type { FastifyReply, FastifyRequest } from "fastify";
import { createAuthService } from "../services/authService.js";
import { sendSuccess } from "../utils/http.js";

interface SignupBody {
  name: string;
  email: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
}

export const createAuthController = (authService: ReturnType<typeof createAuthService>) => ({
  signup: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(reply, 201, await authService.signup(request.body as SignupBody)),

  login: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(reply, 200, await authService.login(request.body as LoginBody)),

  me: async (request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(reply, 200, authService.getCurrentUser(request.authUser!.id)),

  logout: async (request: FastifyRequest, reply: FastifyReply) => {
    authService.logout(request.authUser!.id);
    return sendSuccess(reply, 200, { message: "Logged out successfully." });
  }
});
