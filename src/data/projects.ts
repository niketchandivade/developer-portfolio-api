export interface Project {
  slug: string;
  title: string;
  description: string;
  technologies: string[];
  githubUrl: string;
  demoUrl: string | null;
  featured: boolean;
  status: "completed" | "in-progress";
}

export const projects: Project[] = [
  {
    slug: "developer-portfolio-api",
    title: "Developer Portfolio API",
    description:
      "A REST API built with Node.js and TypeScript to power a developer portfolio.",
    technologies: ["Node.js", "Express", "TypeScript"],
    githubUrl: "https://github.com/your-username/developer-portfolio-api",
    demoUrl: null,
    featured: true,
    status: "in-progress",
  },
  {
    slug: "task-management-app",
    title: "Task Management App",
    description:
      "A task management application for organizing tasks and tracking progress.",
    technologies: ["React", "Next.js", "TypeScript"],
    githubUrl: "https://github.com/your-username/task-management-app",
    demoUrl: null,
    featured: false,
    status: "completed",
  },
];
