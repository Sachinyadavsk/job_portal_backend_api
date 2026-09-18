import express from 'express';
import { applyjob, getApplicants, getAppliedJobs, updateApplicationStatus } from '../controllers/application.controller.js';
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();
router.route("/apply/:id").get(authMiddleware, applyjob);
router.route("/get").get(authMiddleware, getAppliedJobs);
router.route("/:id/applicants").get(authMiddleware, getApplicants);
router.route("/status/:id/update").post(authMiddleware, updateApplicationStatus);

export default router; 