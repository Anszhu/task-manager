export const signupSchema = {
  body: {
    type: "object",
    required: ["name", "email", "password"],
    additionalProperties: false,
    properties: {
      name: { type: "string", minLength: 2, maxLength: 100 },
      email: { type: "string", format: "email", maxLength: 255 },
      password: { type: "string", minLength: 8, maxLength: 128 }
    }
  }
};

export const loginSchema = {
  body: {
    type: "object",
    required: ["email", "password"],
    additionalProperties: false,
    properties: {
      email: { type: "string", format: "email", maxLength: 255 },
      password: { type: "string", minLength: 8, maxLength: 128 }
    }
  }
};
