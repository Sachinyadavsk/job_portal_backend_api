import express from "express";
import { getAdminJobs, getAllJobs, getJobById, postJob, updateJob } from "../controllers/job.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import multer from "multer";
const upload = multer();

const router = express.Router();
router.route("/post").post(isAuthenticated, postJob);
router.route("/get").get(getAllJobs);
router.route("/getadminjobs").get(isAuthenticated, getAdminJobs);
router.route("/get/:id").get(isAuthenticated, getJobById);
router.route("/update/jobs/:id").put(upload.none(), updateJob);

export default router;