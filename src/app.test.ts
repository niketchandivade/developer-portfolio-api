import { describe, it, expect, vi, afterEach } from "vitest";
import request from "supertest";
import app from "./app.js";

import { clearCache } from "./utils/cache.js";

afterEach(() => {
  vi.restoreAllMocks();
  clearCache();
});

describe("GET /api/health", () => {
  it("returns a successful health check", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Portfolio API is running");
    expect(response.body.timestamp).toBeTypeOf("string");
  });
});

describe("GET /api/projects", () => {
  it("returns all projects", async () => {
    const response = await request(app).get("/api/projects");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.count).toBe(response.body.data.length);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it("filters projects by technology", async () => {
    const response = await request(app)
      .get("/api/projects")
      .query({ technology: "React" });

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);

    for (const project of response.body.data) {
      expect(
        project.technologies.some(
          (technology: string) => technology.toLowerCase() === "react",
        ),
      ).toBe(true);
    }
  });

  it("returns an empty list for an unknown technology", async () => {
    const response = await request(app)
      .get("/api/projects")
      .query({ technology: "UnknownTechnology" });

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(0);
    expect(response.body.data).toEqual([]);
  });

  it("rejects an empty technology parameter", async () => {
    const response = await request(app)
      .get("/api/projects")
      .query({ technology: "" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});

describe("GET /api/projects/:slug", () => {
  it("returns a project for a valid slug", async () => {
    const response = await request(app).get(
      "/api/projects/developer-portfolio-api",
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.slug).toBe("developer-portfolio-api");
  });

  it("returns 404 for a nonexistent project", async () => {
    const response = await request(app).get(
      "/api/projects/nonexistent-project",
    );

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Project not found");
  });
});

describe("GET /api/github/repositories", () => {
  const mockRepositories = [
    {
      id: 1,
      name: "react-app",
      description: "React project",
      html_url: "https://github.com/example/react-app",
      homepage: "https://example.com",
      language: "JavaScript",
      stargazers_count: 5,
      topics: ["react"],
      updated_at: "2026-01-01T00:00:00Z",
      fork: false,
    },
    {
      id: 2,
      name: "node-api",
      description: "Node.js API",
      html_url: "https://github.com/example/node-api",
      homepage: null,
      language: "TypeScript",
      stargazers_count: 3,
      topics: ["nodejs"],
      updated_at: "2026-01-02T00:00:00Z",
      fork: true,
    },
  ];

  it("returns repositories from GitHub", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockRepositories), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const response = await request(app).get("/api/github/repositories");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0].name).toBe("react-app");
    expect(response.body.cached).toBe(false);
  });

  it("filters repositories by language", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockRepositories), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const response = await request(app)
      .get("/api/github/repositories")
      .query({ language: "typescript" });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe("node-api");
  });

  it("excludes forked repositories when requested", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockRepositories), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const response = await request(app)
      .get("/api/github/repositories")
      .query({ excludeForks: "true" });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe("react-app");
  });

  it("supports pagination", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockRepositories), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const response = await request(app)
      .get("/api/github/repositories")
      .query({ page: 2, limit: 1 });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe("node-api");
    expect(response.body.pagination.total).toBe(2);
    expect(response.body.pagination.totalPages).toBe(2);
  });

  it.each([
    ["page", "0"],
    ["page", "abc"],
    ["limit", "0"],
    ["limit", "101"],
    ["excludeForks", "yes"],
  ])("rejects invalid %s parameter", async (parameter, value) => {
    const response = await request(app)
      .get("/api/github/repositories")
      .query({ [parameter]: value });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("returns 502 when GitHub responds with an error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Service unavailable", { status: 503 }),
    );

    const response = await request(app).get("/api/github/repositories");

    expect(response.status).toBe(502);
    expect(response.body.success).toBe(false);
  });

  it("returns 502 when GitHub is unreachable", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new TypeError("fetch failed"),
    );

    const response = await request(app).get("/api/github/repositories");

    expect(response.status).toBe(502);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("GitHub API is currently unavailable");
  });
});
