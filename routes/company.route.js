import express from 'express';
import { getCompany, getCompanyById, registerCompany, updateCompany, upload } from '../controllers/company.controller.js';
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();
router.route("/register").post(authMiddleware, registerCompany);
router.route("/get").get(authMiddleware, getCompany);
router.route("/get/:id").get(authMiddleware, getCompanyById);
router.route("/update/:id").put(upload.single("file"), authMiddleware, updateCompany);

export default router;