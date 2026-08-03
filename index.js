import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
const app = express();

import dotenv from 'dotenv';
import connectDB from "./utils/db.js";
import userRoute from "./routes/user.route.js";
import companyRoute from "./routes/company.route.js";
import jobRoute from "./routes/job.route.js";
import applicationRoute from "./routes/application.route.js";
dotenv.config();

// middleware

// serve uploaded images
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(cookieParser());

app.use(cors({
  origin: "http://localhost:5173", // Your React/Vite URL
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;
app.use("/api/v1/user", userRoute);
app.use("/api/v1/company", companyRoute);
app.use("/api/v1/job", jobRoute);
app.use("/api/v1/application", applicationRoute);


// fix __dirname
import { fileURLToPath } from "url";

import webRoutes from "./routes/web.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// view engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// routes
app.use("/", webRoutes);

app.listen(PORT, () => {
    connectDB();
    console.log(`Server running at port ${PORT}`)
});