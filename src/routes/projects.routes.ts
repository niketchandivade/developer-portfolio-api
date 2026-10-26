import { Router } from "express";
import { projects } from "../data/projects.js";
import { projectQuerySchema } from "../schemas/project.schema.js";

const router = Router();

router.get("/", (req, res) => {
  const result = projectQuerySchema.safeParse(req.query);

  if (!result.success) {
    res.status(400).json({
      success: false,
      error: "Invalid query parameters",
      details: result.error.issues,
    });
    return;
  }
  
  const { technology } = result.data;

  const filteredProjects = technology
    ? projects.filter((project) =>
        project.technologies.some(
          (item) =>
            item.toLowerCase() === technology.toLowerCase(),
        ),
      )
    : projects;

  res.status(200).json({
    success: true,
    count: filteredProjects.length,
    data: filteredProjects,
  });
});

router.get("/:slug", (req, res) => {
  const project = projects.find(
    (item) => item.slug === req.params.slug,
  );

  if (!project) {
    res.status(404).json({
      success: false,
      error: "Project not found",
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: project,
  });
});

export default router;
