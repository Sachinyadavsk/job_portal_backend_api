import express from "express";
import { getAdminJobs, getAllJobs, getJobById, getJobDetailsById, postJob, updateJob } from "../controllers/job.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import multer from "multer";
const upload = multer();

const router = express.Router();
router.route("/post").post(authMiddleware, postJob);
router.route("/getDetailsByid/:id").get(getJobDetailsById);
router.route("/get").get(getAllJobs);
router.route("/getadminjobs").get(authMiddleware, getAdminJobs);
router.route("/get/:id").get(authMiddleware, getJobById);
router.route("/update/jobs/:id").put(upload.none(), updateJob);

export default router;