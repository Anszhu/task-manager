import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { FastifyInstance } from "fastify";
import { createApp } from "../app.js";

describe("Team Task Manager API", () => {
  let app: FastifyInstance;
  let tempDir: string;
  let adminToken = "";
  let memberToken = "";
  let projectId = 0;
  let taskId = 0;
  let memberId = 0;

  before(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "ttm-"));
    app = createApp({
      NODE_ENV: "test",
      PORT: 0,
      JWT_SECRET: "test-secret",
      JWT_EXPIRES_IN: "1h",
      CLIENT_ORIGINS: ["http://127.0.0.1:4301"],
      DB_FILE: join(tempDir, "test.sqlite")
    });
    await app.ready();
  });

  after(async () => {
    await app.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("creates the first user as admin", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/signup",
      payload: {
        name: "Admin User",
        email: "admin@example.com",
        password: "supersecure1"
      }
    });

    assert.equal(response.statusCode, 201);
    const body = response.json();
    assert.equal(body.data.user.role, "admin");
    adminToken = body.data.token;
  });

  it("creates additional users as members", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/signup",
      payload: {
        name: "Member User",
        email: "member@example.com",
        password: "supersecure2"
      }
    });

    assert.equal(response.statusCode, 201);
    const body = response.json();
    assert.equal(body.data.user.role, "member");
    memberToken = body.data.token;
    memberId = body.data.user.id;
  });

  it("lets admins create projects, add members, and create tasks", async () => {
    const projectResponse = await app.inject({
      method: "POST",
      url: "/api/projects",
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        name: "Launch Sprint",
        description: "Initial launch project"
      }
    });

    assert.equal(projectResponse.statusCode, 201);
    projectId = projectResponse.json().data.id;

    const memberResponse = await app.inject({
      method: "POST",
      url: `/api/projects/${projectId}/members`,
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        userId: memberId
      }
    });

    assert.equal(memberResponse.statusCode, 200);
    assert.equal(memberResponse.json().data.length, 2);

    const taskResponse = await app.inject({
      method: "POST",
      url: "/api/tasks",
      headers: {
        authorization: `Bearer ${adminToken}`
      },
      payload: {
        projectId,
        title: "Design dashboard",
        description: "Create a responsive dashboard page",
        assigneeId: memberId,
        deadline: "2030-01-01T12:00:00.000Z"
      }
    });

    assert.equal(taskResponse.statusCode, 201);
    taskId = taskResponse.json().data.id;
  });

  it("lets assigned members update only their task status", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: `/api/tasks/${taskId}`,
      headers: {
        authorization: `Bearer ${memberToken}`
      },
      payload: {
        status: "done"
      }
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().data.status, "done");
  });

  it("returns dashboard summaries", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/dashboard/summary",
      headers: {
        authorization: `Bearer ${adminToken}`
      }
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().data.completedTasks, 1);
  });
});
