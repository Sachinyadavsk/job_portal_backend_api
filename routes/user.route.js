import express from "express";
import { deleteUserById, getAllUsers, getByIdUsers, login, logout, register, updateProfile, updateProfileimage, upload } from "../controllers/user.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";


const router = express.Router();
router.route("/register").post(upload.single("profilePhoto"), register);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/profile/update/:id").put(upload.single("resume"), isAuthenticated, updateProfile);
router.route("/getAllUsers").get(getAllUsers);
router.route("/getByIdUsers/:id").get(getByIdUsers);
router.route("/profile/images/:id").put(upload.single("profilePhoto"), isAuthenticated, updateProfileimage);
router.route("/users/delete/:id").delete(deleteUserById);




export default router;
