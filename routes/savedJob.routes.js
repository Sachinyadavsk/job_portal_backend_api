import express from "express";

import { saveJob, unsaveJob, getSavedJobs, checkSavedJob } from "../controllers/savedJob.controller.js";

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/save", authMiddleware, saveJob);
router.delete("/remove/:jobId", authMiddleware, unsaveJob);
router.get("/getSavedJobs", authMiddleware, getSavedJobs);
router.get("/check/:jobId", authMiddleware, checkSavedJob);

export default router;