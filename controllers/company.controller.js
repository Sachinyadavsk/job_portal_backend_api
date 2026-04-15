import Company from "../models/company.model.js";

export const registerCompany = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({
                message: "Company name is required",
                success: false
            })
        }

        let company = await Company.findOne({ name});
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
    try {
        const { name, description, website, location } = req.body;
        const file = req.file;

        // set companyid to check now
        const updateData = { name, description, website, location }
        const company = await Company.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!company) {
            return res.status(404).json({
                message: "Company not found",
                success: false
            })
        }

        return res.status(200).json({
            message: "Company information updated",
            success: true,
            company
        })
    } catch (error) {
        console.error("Error in updateCompany controller:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        })
    }
}