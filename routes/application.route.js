import express from 'express';
import { applyjob, getApplicants, getAppliedJobs, updateApplicationStatus } from '../controllers/application.controller.js';
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();
router.route("/apply/:id").get(isAuthenticated, applyjob);
router.route("/get").get(isAuthenticated, getAppliedJobs);
router.route("/:id/applicants").get(isAuthenticated, getApplicants);
router.route("/status/:id/update").post(isAuthenticated, updateApplicationStatus);

export default router; 