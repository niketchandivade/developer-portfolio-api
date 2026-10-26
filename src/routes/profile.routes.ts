import { Router } from "express";
import { profile } from "../data/profile.js";

const router = Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    data: profile,
  });
});

export default router;
