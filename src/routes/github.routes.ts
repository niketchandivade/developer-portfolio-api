import { Router } from "express";
import { getCache, setCache } from "../utils/cache.js";
import type { GitHubRepository } from "../types/github.js";
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../middleware/errorHandler.js";
import { githubQuerySchema } from "../schemas/github.schema.js";

const router = Router();

const CACHE_KEY = "github-repositories";
const CACHE_TTL = 5 * 60 * 1000;
const GITHUB_USERNAME = "niketchandivade";

async function fetchRepositories(): Promise<GitHubRepository[]> {
  const response = await fetch(
    `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`,
    {
      headers: {
        Accept: "application/vnd.github+json",
      },
      signal: AbortSignal.timeout(5000),
    },
  );

  if (!response.ok) {
    throw new AppError(`GitHub API returned status ${response.status}`, 502);
  }

  const repositories = (await response.json()) as GitHubRepository[];

  setCache(CACHE_KEY, repositories, CACHE_TTL);

  return repositories;
}

router.get(
  "/repositories",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedQuery = githubQuerySchema.safeParse(req.query);

      if (!parsedQuery.success) {
        res.status(400).json({
          success: false,
          error: "Invalid query parameters",
          details: parsedQuery.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
        return;
      }

      const { language, excludeForks, page, limit } = parsedQuery.data;

      const cachedRepositories = getCache<GitHubRepository[]>(CACHE_KEY);
      const isCached = cachedRepositories !== null;
      const repositories = cachedRepositories ?? (await fetchRepositories());

      const data = repositories.map((repo) => ({
        id: repo.id,
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
        demoUrl: repo.homepage,
        language: repo.language,
        stars: repo.stargazers_count,
        topics: repo.topics,
        updatedAt: repo.updated_at,
        fork: repo.fork,
      }));

      const filteredData = data.filter((repo) => {
        const matchesLanguage =
          !language || repo.language?.toLowerCase() === language.toLowerCase();

        const matchesForks = excludeForks !== "true" || !repo.fork;

        return matchesLanguage && matchesForks;
      });

      const startIndex = (page - 1) * limit;
      const paginatedData = filteredData.slice(startIndex, startIndex + limit);

      res.status(200).json({
        success: true,
        cached: isCached,
        count: paginatedData.length,
        pagination: {
          page,
          limit,
          total: filteredData.length,
          totalPages: Math.ceil(filteredData.length / limit),
        },
        data: paginatedData,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
        return;
      }

      if (error instanceof Error) {
        next(new AppError("GitHub API is currently unavailable", 502));
        return;
      }

      next(error);
    }
  },
);

export default router;
