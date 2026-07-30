import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

// ✅ Cloudinary Storage
const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        if (file.fieldname === "profilePhoto") {
            return {
                folder: "users/images",
                allowed_formats: ["jpg", "png", "jpeg", "webp"],
                resource_type: "image"
            };
        }

        // ✅ RESUME (PDF)
        if (file.fieldname === "resume") {
            return {
                folder: "users/resumes",
                resource_type: "raw",
                allowed_formats: ["pdf"]
            };
        }

        throw new Error("Invalid file field");
    }
});

// ✅ Multer Upload
export const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB (better for profile image)
});

// ✅ Extract public_id from Cloudinary URL
const getPublicId = (url) => {
    try {
        const splitUrl = url.split("/");
        const fileWithExt = splitUrl.pop();
        const folderPath = splitUrl.slice(splitUrl.indexOf("upload") + 1);

        const fileName = fileWithExt.split(".")[0];

        return [...folderPath, fileName].join("/");
    } catch {
        return null;
    }
};



// ================= REGISTER =================
export const register = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, password, role } = req.body;

        if (!fullname || !email || !phoneNumber || !password || !role) {
            return res.status(400).json({
                message: "All fields are required",
                success: false
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: "User already exists",
                success: false
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // ✅ handle uploaded image
        let profilePhoto = "";
        if (req.file) {
            profilePhoto = req.file.path; // cloudinary or multer path
        }

        const user = await User.create({
            fullname,
            email,
            phoneNumber,
            password: hashedPassword,
            role,
            profile: {
                profilePhoto
            }
        });

        return res.status(201).json({
            message: "User registered successfully",
            success: true,
            user
        });

    } catch (error) {
        console.error("Register Error:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};



// ================= LOGIN =================
export const login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({
                message: "Missing credentials",
                success: false
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password",
                success: false
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid email or password",
                success: false
            });
        }

        if (user.role !== role) {
            return res.status(400).json({
                message: "Invalid role",
                success: false
            });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        return res
            .status(200)
            .cookie("token", token, {
                maxAge: 24 * 60 * 60 * 1000,
                httpOnly: true,
                sameSite: "strict"
            })
            .json({
                message: `Welcome ${user.fullname}`,
                success: true,
                user
            });

    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};



// ================= LOGOUT =================
export const logout = async (req, res) => {
    try {
        return res
            .status(200)
            .cookie("token", "", {
                maxAge: 0,
                httpOnly: true,
                sameSite: "strict"
            })
            .json({
                message: "Logged out successfully",
                success: true
            });
    } catch {
        return res.status(500).json({
            message: "Logout failed",
            success: false
        });
    }
};

// ================= delete users list by  id   =================
export const deleteUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false,
            });
        }

        // ✅ delete user
        await User.findByIdAndDelete(id);

        return res.status(200).json({
            message: "User deleted successfully",
            success: true,
        });

    } catch (error) {
        console.error("Delete Error:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
        });
    }
};

// ================= UPDATE PROFILE image  =================
export const updateProfileimage = async (req, res) => {
    // console.log("hello");
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }
        if (!user.profile) user.profile = {};
        // ✅ Image Update Logic
        if (req.file) {
            // delete old image
            if (user.profile.profilePhoto) {
                const publicId = getPublicId(user.profile.profilePhoto);
                if (publicId) {
                    await cloudinary.uploader.destroy(publicId);
                }
            }
            // set new image
            user.profile.profilePhoto = req.file.path;
        }

        // ✅ Update fields
        await user.save();
        return res.status(200).json({
            message: "Profile image upgate updated successfully",
            success: true,
            user
        });

    } catch (error) {
        console.error("Update Error:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// ================= UPDATE PROFILE =================
export const updateProfile = async (req, res) => {
    // console.log("hello");
    try {
        const { id } = req.params;
        const { fullname, email, phoneNumber, bio } = req.body;
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        if (!user.profile) user.profile = {};
        // ✅ Skills parsing
        let skills = [];
        try {
            if (req.body.skills) {
                skills = typeof req.body.skills === "string"
                    ? JSON.parse(req.body.skills)
                    : req.body.skills;
            }
        } catch {
            skills = [];
        }

        // ================= RESUME UPLOAD =================
        if (req.files?.resume?.[0]) {
            const file = req.files.resume[0];

            // delete old resume
            if (user.profile.resume) {
                const publicId = getPublicId(user.profile.resume);
                if (publicId) {
                    await cloudinary.uploader.destroy(publicId, {
                        resource_type: "raw"
                    });
                }
            }

            user.profile.resume = file.path;
            user.profile.resumeOriginalName = file.originalname;
        }

        // ✅ Update fields
        user.fullname = fullname || user.fullname;
        user.email = email || user.email;
        user.phoneNumber = phoneNumber || user.phoneNumber;
        user.profile.bio = bio || user.profile.bio;
        user.profile.skills = skills;
        await user.save();
        return res.status(200).json({
            message: "Profile updated successfully",
            success: true,
            user
        });

    } catch (error) {
        console.error("Update Error:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const user = await User.find();
        // ✅ If no users found
        if (user.length === 0) {
            return res.status(404).json({
                message: "No users found",
                success: false
            });
        }

        return res.status(200).json({
            message: "User fetched successfully",
            success: true,
            count: user.length,
            user
        })
    } catch (error) {
        console.error("Get All Users Error:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}

export const getByIdUsers = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        // ✅ If no users found
        if (user.length === 0) {
            return res.status(404).json({
                message: "No users found",
                success: false
            });
        }

        return res.status(200).json({
            message: "User Profile Details By id",
            success: true,
            user
        })
    } catch (error) {
        console.error("Get profile by id Users Error:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}