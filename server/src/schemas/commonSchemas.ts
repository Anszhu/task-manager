export const idParamSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "integer", minimum: 1 }
  }
};

export const memberParamSchema = {
  type: "object",
  required: ["id", "memberId"],
  properties: {
    id: { type: "integer", minimum: 1 },
    memberId: { type: "integer", minimum: 1 }
  }
};

export const paginationQuerySchema = {
  type: "object",
  properties: {
    page: { type: "integer", minimum: 1, default: 1 },
    pageSize: { type: "integer", minimum: 1, maximum: 100, default: 10 }
  }
};
