export const dashboardSummarySchema = {
  querystring: {
    type: "object",
    properties: {
      projectId: { type: "integer", minimum: 1 },
      assigneeId: { type: "integer", minimum: 1 }
    }
  }
};
