import type { FastifyReply } from "fastify";
import { AppError } from "./errors.js";

export const sendSuccess = <T>(
  reply: FastifyReply,
  statusCode: number,
  data: T,
  meta?: unknown
) => reply.code(statusCode).send({ success: true, data, meta });

export const handleError = (reply: FastifyReply, error: unknown) => {
  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    });
  }

  return reply.code(500).send({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong on the server."
    }
  });
};
