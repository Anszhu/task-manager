import type { FastifyReply, FastifyRequest } from "fastify";
import { createUserService } from "../services/userService.js";
import { sendSuccess } from "../utils/http.js";

interface UserQuery {
  query?: string;
  limit?: number;
}

export const createUserController = (userService: ReturnType<typeof createUserService>) => ({
  search: async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as UserQuery;
    return sendSuccess(reply, 200, userService.searchUsers(request.authUser!, query.query, query.limit));
  }
});
