import { createProjectRepository } from "../repositories/projectRepository.js";
import { createUserRepository } from "../repositories/userRepository.js";
import type { AuthenticatedUser } from "../types/domain.js";
import { conflict, forbidden, notFound } from "../utils/errors.js";

const sanitizeText = (value: string) => value.trim().replace(/\s+/g, " ");

export const createProjectService = (
  projectRepository: ReturnType<typeof createProjectRepository>,
  userRepository: ReturnType<typeof createUserRepository>
) => ({
  listProjects(viewer: AuthenticatedUser) {
    return projectRepository.listAccessibleProjects(viewer.id, viewer.role);
  },

  createProject(viewer: AuthenticatedUser, input: { name: string; description?: string }) {
    if (viewer.role !== "admin") {
      throw forbidden();
    }

    const name = sanitizeText(input.name);
    const description = input.description?.trim() ?? "";

    if (name.length < 2) {
      throw conflict("Project name must be at least 2 characters long.");
    }

    return projectRepository.createProject({
      name,
      description,
      ownerId: viewer.id
    });
  },

  getProject(viewer: AuthenticatedUser, projectId: number) {
    const project = projectRepository.findAccessibleProject(projectId, viewer.id, viewer.role);
    if (!project) {
      throw notFound("Project not found.");
    }

    return project;
  },

  listMembers(viewer: AuthenticatedUser, projectId: number) {
    this.getProject(viewer, projectId);
    return projectRepository.listMembers(projectId);
  },

  addMember(viewer: AuthenticatedUser, projectId: number, userId: number) {
    if (viewer.role !== "admin") {
      throw forbidden();
    }

    const project = projectRepository.findProjectById(projectId);
    if (!project) {
      throw notFound("Project not found.");
    }

    const user = userRepository.findById(userId);
    if (!user) {
      throw notFound("User not found.");
    }

    if (projectRepository.isMember(projectId, userId)) {
      throw conflict("That user is already a member of this project.");
    }

    projectRepository.addMember(projectId, userId);
    return projectRepository.listMembers(projectId);
  },

  removeMember(viewer: AuthenticatedUser, projectId: number, userId: number) {
    if (viewer.role !== "admin") {
      throw forbidden();
    }

    const project = projectRepository.findProjectById(projectId);
    if (!project) {
      throw notFound("Project not found.");
    }

    if (project.ownerId === userId) {
      throw conflict("The project owner cannot be removed.");
    }

    if (!projectRepository.isMember(projectId, userId)) {
      throw notFound("That user is not part of this project.");
    }

    projectRepository.removeMember(projectId, userId);
    return projectRepository.listMembers(projectId);
  },

  deleteProject(viewer: AuthenticatedUser, projectId: number) {
    if (viewer.role !== "admin") {
      throw forbidden();
    }

    const project = projectRepository.findProjectById(projectId);
    if (!project) {
      throw notFound("Project not found.");
    }

    projectRepository.deleteProject(projectId);
  }
});
