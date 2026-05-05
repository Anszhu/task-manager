import type { FastifyReply, FastifyRequest } from "fastify";
import { createAuthService } from "../services/authService.js";
import { unauthorized } from "../utils/errors.js";

export const buildAuthenticate =
  (authService: ReturnType<typeof createAuthService>) =>
  async (request: FastifyRequest, _reply: FastifyReply) => {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw unauthorized();
    }

    const token = header.slice("Bearer ".length).trim();
    request.authUser = authService.authenticate(token);
  };
