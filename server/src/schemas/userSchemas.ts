export const userSearchSchema = {
  querystring: {
    type: "object",
    properties: {
      query: { type: "string", maxLength: 100 },
      limit: { type: "integer", minimum: 1, maximum: 50, default: 12 }
    }
  }
};
