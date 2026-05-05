import { createUserRepository } from "../repositories/userRepository.js";
import type { AuthenticatedUser } from "../types/domain.js";
import { forbidden } from "../utils/errors.js";

export const createUserService = (userRepository: ReturnType<typeof createUserRepository>) => ({
  searchUsers(viewer: AuthenticatedUser, query = "", limit = 12) {
    if (viewer.role !== "admin") {
      throw forbidden();
    }

    return userRepository.searchUsers(query.trim(), limit);
  }
});
