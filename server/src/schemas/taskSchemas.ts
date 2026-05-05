import { idParamSchema, paginationQuerySchema } from "./commonSchemas.js";

const taskStatusEnum = ["todo", "in_progress", "done"];

export const listTaskSchema = {
  querystring: {
    ...paginationQuerySchema,
    properties: {
      ...paginationQuerySchema.properties,
      status: { type: "string", enum: taskStatusEnum },
      projectId: { type: "integer", minimum: 1 },
      assigneeId: { type: "integer", minimum: 1 },
      search: { type: "string", maxLength: 120 }
    }
  }
};

export const createTaskSchema = {
  body: {
    type: "object",
    required: ["projectId", "title"],
    additionalProperties: false,
    properties: {
      projectId: { type: "integer", minimum: 1 },
      title: { type: "string", minLength: 2, maxLength: 160 },
      description: { type: "string", maxLength: 2000 },
      deadline: { anyOf: [{ type: "string", format: "date-time" }, { type: "null" }] },
      status: { type: "string", enum: taskStatusEnum },
      assigneeId: { anyOf: [{ type: "integer", minimum: 1 }, { type: "null" }] }
    }
  }
};

export const updateTaskSchema = {
  params: idParamSchema,
  body: {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string", minLength: 2, maxLength: 160 },
      description: { type: "string", maxLength: 2000 },
      deadline: { anyOf: [{ type: "string", format: "date-time" }, { type: "null" }] },
      status: { type: "string", enum: taskStatusEnum },
      assigneeId: { anyOf: [{ type: "integer", minimum: 1 }, { type: "null" }] }
    }
  }
};

export const taskIdSchema = {
  params: idParamSchema
};
