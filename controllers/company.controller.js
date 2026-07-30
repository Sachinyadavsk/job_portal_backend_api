import Company from "../models/company.model.js";

import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

// ✅ Cloudinary Storage
const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        if (file.fieldname === "file") {
            return {
                folder: "companies/logos",
                allowed_formats: ["jpg", "png", "jpeg", "webp"],
                resource_type: "image"
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

export const registerCompany = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({
                message: "Company name is required",
                success: false
            })
        }

        let company = await Company.findOne({ name });
        if (company) {
            return res.status(400).json({
                message: "Company already exists",
                success: false
            })
        }
        company = await Company.create({
            name,
            userId: req.userId
        });
        return res.status(201).json({
            message: "Company registered successfully",
            success: true,
            company
        })

    } catch (error) {
        console.error("Error in registerCompany controller:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        })
    }
}

export const getCompany = async (req, res) => {
    try {
        const userId = req.userId; // Assuming req.userId contains the authenticated user's ID
        const companies = await Company.find({ userId });
        if (!companies || companies.length === 0) {
            return res.status(404).json({
                message: "Company not found",
                success: false
            })
        }
        return res.status(200).json({
            message: "Company details fetched successfully",
            success: true,
            companies
        })


    } catch (error) {
        console.error("Error in getCompany controller:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        })
    }
}

export const getCompanyById = async (req, res) => {
    try {
        const companyId = req.params.id;
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({
                message: "Company not found",
                success: false
            })
        }
        return res.status(200).json({
            message: "Company details fetched successfully",
            success: true,
            company
        })
    } catch (error) {
        console.error("Error in getCompanyById controller:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        })
    }
}

export const updateCompany = async (req, res) => {
    // console.log("req.file:", req.file);
    try {
        const company = await Company.findById(req.params.id);

        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company not found",
            });
        }

        company.name = req.body.name || company.name;
        company.description = req.body.description || company.description;
        company.website = req.body.website || company.website;
        company.location = req.body.location || company.location;

        if (req.file) {
            if (company.logo) {
                const publicId = getPublicId(company.logo);
                if (publicId) {
                    await cloudinary.uploader.destroy(publicId);
                }
            }

            company.logo = req.file.path;
        }

        await company.save();

        return res.status(200).json({
            success: true,
            message: "Company updated successfully",
            company,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};