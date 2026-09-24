import express from 'express';
import { applycheckjob, applyjob, getApplicants, getAppliedJobs, updateApplicationStatus } from '../controllers/application.controller.js';
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();
router.route("/apply/:id").get(authMiddleware, applyjob);
router.route("/apply/check/:id").get(authMiddleware, applycheckjob);
router.route("/get").get(authMiddleware, getAppliedJobs);

// admin
router.route("/:id/applicants").get(authMiddleware, getApplicants);
router.route("/status/:id/update").post(authMiddleware, updateApplicationStatus);

export default router; 