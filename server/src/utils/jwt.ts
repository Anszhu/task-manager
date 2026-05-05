import jwt, { type JwtPayload, type Secret, type SignOptions } from "jsonwebtoken";
import type { AuthTokenPayload, EnvConfig } from "../types/domain.js";

export const signAuthToken = (
  payload: AuthTokenPayload,
  env: Pick<EnvConfig, "JWT_SECRET" | "JWT_EXPIRES_IN">
) =>
  jwt.sign(payload, env.JWT_SECRET as Secret, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"]
  });

export const verifyAuthToken = (token: string, env: Pick<EnvConfig, "JWT_SECRET">) => {
  const decoded = jwt.verify(token, env.JWT_SECRET as Secret) as JwtPayload | string;

  if (typeof decoded === "string") {
    throw new Error("Invalid token payload.");
  }

  return decoded as unknown as AuthTokenPayload;
};
