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

        // Validate input
        if (!email || !password || !role) {
            return res.status(400).json({
                status: "error",
                message: "Email, Password and Role are required"
            });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                status: "error",
                message: "Invalid email or password"
            });
        }

        // Check role
        if (user.role !== role) {
            return res.status(403).json({
                status: "error",
                message: "Invalid role for this account"
            });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                status: "error",
                message: "Invalid email or password"
            });
        }

        // Generate JWT Token
        const token = jwt.sign(
            {
                id: user._id,
                userId: user._id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET || "mysecretkey",
            {
                expiresIn: "7d"
            }
        );

        return res.status(200).json({
            status: "success",
            message: "Login successful",
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: error.message
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
        const userId = req.user.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }
        if (!user.profile) user.profile = {};

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Profile image is required"
            });
        }
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

    try {
        const userId = req.user.userId;
        const { fullname, email, phoneNumber, bio, location, jobTitle, experience } = req.body;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }

        const user = await User.findById(userId);
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
            // console.log("Resume file:", file);

            // PDF only
            if (file.mimetype !== "application/pdf") {
                return res.status(400).json({
                    success: false,
                    message: "Only PDF files are allowed"
                });
            }

            // 5MB maximum
            if (file.size > 5 * 1024 * 1024) {
                return res.status(400).json({
                    success: false,
                    message: "Resume must be less than 5MB"
                });
            }

            // delete old resume
            if (user.profile.resume) {
                const publicId = getPublicId(user.profile.resume);
                if (publicId) {
                    await cloudinary.uploader.destroy(
                        publicId,
                        {
                            resource_type: "raw"
                        }
                    );
                }
            }

            user.profile.resume = file.path;
            user.profile.resumeOriginalName = file.originalname;
        }

        // ✅ Update fields
        user.fullname = fullname || user.fullname;
        user.email = email || user.email;
        user.phoneNumber = phoneNumber || user.phoneNumber;
        user.location = location || user.location;
        user.jobTitle = jobTitle || user.jobTitle;
        user.experience = experience || user.experience;
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

export const removeResume = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (!user.profile?.resume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found"
            });
        }

        // Delete resume from Cloudinary
        const publicId = getPublicId(user.profile.resume);
        if (publicId) {
            await cloudinary.uploader.destroy(
                publicId,
                {
                    resource_type: "raw"
                }
            );
        }

        user.profile.resume = "";
        user.profile.resumeOriginalName = "";
        await user.save();
        return res.status(200).json({
            success: true,
            message: "Resume removed successfully",
            user
        });
    } catch (error) {
        console.error("Remove Resume Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};