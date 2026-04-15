import express from "express";
const router = express.Router();

import { homepage } from "../controllers/homecontroller.js";

// Home route
router.get("/", homepage);

export default router;