import Job from "../models/job.model.js";

// admin post job, get all jobs, get job by id, update job, delete job
export const postJob = async (req, res) => {
    try {
        const { title, description, requirements, salary, location, jobType, experience, position, companyid } = req.body;
        const userid = req.userId; // Assuming you have user authentication and the user ID is available in req.user
        if (!title || !description || !requirements || !salary || !location || !jobType || !experience || !position || !companyid) {
            return res.status(400).json({
                message: "All fields are required",
                success: false
            })
        }

        const job = await Job.create({
            title,
            description,
            requirements: requirements.split(",").map(req => req.trim()), // Assuming requirements are sent as a comma-separated string
            salary: Number(salary),
            location,
            jobType,
            experienceLevel: Number(experience),
            position,
            company: companyid,
            created_by: userid
        })
        return res.status(201).json({
            message: "New job created successfully",
            job,
            success: true
        })
    } catch (error) {
        console.error("Error in postJob controller:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        })
    }
}

// studens get All Jobs.
export const getAllJobs = async (req, res) => {
    try {
        const keyword = req.query.keyword || "";
        const query = {
            $or: [
                { title: { $regex: keyword, $options: "i" } },
                { description: { $regex: keyword, $options: "i" } }
            ]
        };
        const jobs = await Job.find(query).populate({
            path: "company"
        }).sort({ createdAt: -1 }); // Populate company details (name and location)
        if (!jobs) {
            return res.status(404).json({
                message: "No jobs found",
                success: false
            })
        }
        return res.status(200).json({
            message: "All jobs fetched successfully",
            jobs,
            success: true
        })
    } catch (error) {
        console.error("Error in getAllJobs controller:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        })
    }
}

// students get job by id, also get company details in the same response using populate method of mongoose.
export const getJobById = async (req, res) => {
    try {
        const jobId = req.params.id;
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                message: "Job not found",
                success: false
            })
        }
        return res.status(200).json({
            message: "Job found successfully",
            job,
            success: true
        })
    } catch (error) {
        console.error("Error in getJobById controller:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        })
    }
}

// admin total create jobs list
export const getAdminJobs = async (req, res) => {
    try {
        const adminId = req.userId; // Assuming you have user authentication and the user ID is available in req.user
        const jobs = await Job.find({ created_by: adminId });
        if (!jobs) {
            return res.status(404).json({
                message: "No jobs created by this admin",
                success: false
            })
        }
        return res.status(200).json({
            jobs,
            success: true
        })
    } catch (error) {
        console.error("Error in getAdminJobs controller:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        })
    }
}