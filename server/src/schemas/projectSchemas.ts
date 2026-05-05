import { idParamSchema, memberParamSchema } from "./commonSchemas.js";

export const createProjectSchema = {
  body: {
    type: "object",
    required: ["name"],
    additionalProperties: false,
    properties: {
      name: { type: "string", minLength: 2, maxLength: 120 },
      description: { type: "string", maxLength: 1000 }
    }
  }
};

export const projectIdSchema = {
  params: idParamSchema
};

export const addMemberSchema = {
  params: idParamSchema,
  body: {
    type: "object",
    required: ["userId"],
    additionalProperties: false,
    properties: {
      userId: { type: "integer", minimum: 1 }
    }
  }
};

export const removeMemberSchema = {
  params: memberParamSchema
};
