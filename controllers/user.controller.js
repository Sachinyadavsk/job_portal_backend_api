import User from "../models/user.model.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, password, role } = req.body;
        const file = req.file;
        if (!fullname || !email || !phoneNumber || !password || !role) {
            return res.status(400).json({
                message: "All fields Required",
                success: false
            });
        };

        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                message: "User already exist with this email.",
                success: false
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({
            fullname,
            email,
            phoneNumber,
            password: hashedPassword,
            role,
            profile: {
                profilePhoto: file ? file.path : ""
            }
        });

        return res.status(201).json({
            message: "User registered successfully",
            success: true
        })

    } catch (error) {
        console.error("Error in register controller:", error);
    }
}

export const login = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        if (!email || !password || !role) {
            return res.status(400).json({
                message: 'Some fields are missing',
                success: false
            });
        };

        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                message: "Incorrect email or password.",
                success: false
            })
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({
                message: "Invalid password.",
                success: false
            })
        }
        // check role is correct or not
        if (user.role !== role) {
            return res.status(400).json({
                message: "Account doesn't exist with the provided role.",
                success: false
            })
        }

        const tokenData = {
            userId: user._id,
        }

        const token = await jwt.sign(tokenData, process.env.JWT_SECRET, { expiresIn: '1d' });

        user = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        }
        return res.status(200).cookie("token", token, { maxAge: 1 * 24 * 60 * 60 * 1000, httpsOnly: true, sameSite: 'strict' }).json({
            message: `Welcome back ${user.fullname}`,
            success: true,
            user

        })
    } catch (error) {
        console.error("Error in login controller:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        })
    }
}

export const logout = async (req, res) => {
    try {
        return res.status(200).cookie("token", "", { maxAge: 0, httpsOnly: true, sameSite: 'strict' }).json({
            message: "Logged out successfully",
            success: true
        })
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            success: false
        })
    }
}

export const updateProfile = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, bio, skills } = req.body;
        const file = req.file; // Assuming you're using multer for file uploads
        if (!fullname && !email && !phoneNumber && !bio && !skills) {
            return res.status(400).json({
                message: "At least one field is required to update profile",
                success: false
            })
        }

        const skillsArray = skills ? skills.split(',').map(skill => skill.trim()) : undefined;
        const userId = req.userId;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            })
        }
        // Update only the fields that are provided in the request body
        user.fullname = fullname || user.fullname;
        user.email = email || user.email;
        user.phoneNumber = phoneNumber || user.phoneNumber;
        user.profile.bio = bio || user.profile.bio;
        user.profile.skills = skillsArray || user.profile.skills;

        // resume and profile photo will be handled in separate endpoints as they require file upload handling

        await user.save();
        const updatedUser = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        }
        return res.status(200).json({
            message: "Profile updated successfully",
            success: true,
            updatedUser
        })

    } catch (error) {
        // Log the error for debugging purposes
        console.error("Error in updateProfile controller:", error);
        return res.status(500).json({
            message: "Something went wrong",
            success: false
        })
    }
}