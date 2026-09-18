import express from "express";
import { deleteUserById, getAllUsers, getByIdUsers, login, logout, register, removeResume, updateProfile, updateProfileimage, upload } from "../controllers/user.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";


const router = express.Router();
router.route("/register").post(upload.single("profilePhoto"), register);
router.route("/login").post(login);
router.route("/logout").get(logout);
// router.route("/profile/update/:id").put(upload.single("resume"), authMiddleware, updateProfile);
router.route("/profile/update/:id").put(authMiddleware, upload.fields([{ name: "resume", maxCount: 1 }]), updateProfile);
router.route("/getAllUsers").get(getAllUsers);
router.route("/getByIdUsers/:id").get(getByIdUsers);
router.route("/profile/images/:id").put(upload.single("profilePhoto"), authMiddleware, updateProfileimage);
router.route("/users/delete/:id").delete(deleteUserById);
router.route("/profile/resume/:id").delete(authMiddleware, removeResume);




export default router;
