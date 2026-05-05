import type { EnvConfig, UserRecord } from "../types/domain.js";
import { badRequest, conflict, unauthorized } from "../utils/errors.js";
import { signAuthToken, verifyAuthToken } from "../utils/jwt.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { createUserRepository } from "../repositories/userRepository.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeName = (value: string) => value.trim().replace(/\s+/g, " ");
const sanitizeEmail = (value: string) => value.trim().toLowerCase();

const validatePassword = (value: string) => value.length >= 8;

export const createAuthService = (
  userRepository: ReturnType<typeof createUserRepository>,
  env: EnvConfig
) => {
  const buildAuthPayload = (user: UserRecord) => ({
    token: signAuthToken(
      {
        sub: user.id,
        role: user.role,
        sessionVersion: user.sessionVersion
      },
      env
    ),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });

  return {
    async signup(input: { name: string; email: string; password: string }) {
      const name = sanitizeName(input.name);
      const email = sanitizeEmail(input.email);
      const password = input.password.trim();

      if (name.length < 2) {
        throw badRequest("Name must be at least 2 characters long.");
      }

      if (!emailPattern.test(email)) {
        throw badRequest("Please enter a valid email address.");
      }

      if (!validatePassword(password)) {
        throw badRequest("Password must be at least 8 characters long.");
      }

      const existingUser = userRepository.findByEmailWithPassword(email);
      if (existingUser) {
        throw conflict("An account with that email already exists.");
      }

      const role = userRepository.countUsers() === 0 ? "admin" : "member";
      const passwordHash = await hashPassword(password);
      const user = userRepository.createUser({ name, email, passwordHash, role });

      if (!user) {
        throw unauthorized("Unable to create the user account.");
      }

      return buildAuthPayload(user);
    },

    async login(input: { email: string; password: string }) {
      const email = sanitizeEmail(input.email);
      const password = input.password.trim();
      const record = userRepository.findByEmailWithPassword(email);

      if (!record) {
        throw unauthorized("Invalid email or password.");
      }

      const passwordMatches = await verifyPassword(password, record.passwordHash);
      if (!passwordMatches) {
        throw unauthorized("Invalid email or password.");
      }

      return buildAuthPayload(record.user);
    },

    getCurrentUser(userId: number) {
      const user = userRepository.findById(userId);
      if (!user) {
        throw unauthorized();
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };
    },

    authenticate(token: string) {
      let payload;

      try {
        payload = verifyAuthToken(token, env);
      } catch {
        throw unauthorized("Your session has expired. Please sign in again.");
      }

      const user = userRepository.findById(payload.sub);

      if (!user || user.sessionVersion !== payload.sessionVersion) {
        throw unauthorized("Your session has expired. Please sign in again.");
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        sessionVersion: user.sessionVersion
      };
    },

    logout(userId: number) {
      const updated = userRepository.incrementSessionVersion(userId);
      if (!updated) {
        throw unauthorized();
      }
    }
  };
};
