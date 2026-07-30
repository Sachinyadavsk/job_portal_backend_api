import Application from "../models/application.model.js";
import Job from "../models/job.model.js";

export const applyjob = async (req, res) => {
    try {
        const userId = req.userId;
        const jobId = req.params.id;
        if (!jobId) {
            return res.status(400).json({
                message: "Job ID is required",
                success: false
            });
        }
        // Check if the user has already applied for the job
        const existingApplication = await Application.findOne({ applicant: userId, job: jobId });
        if (existingApplication) {
            return res.status(400).json({
                message: "You have already applied for this job",
                success: false
            });
        }

        // check if the job exists
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                message: "Job not found",
                success: false
            });
        }
        // Create a new application
        const newapplication = await Application.create({
            job: jobId,
            applicant: userId
        });
        job.applications.push(newapplication._id);
        await job.save();
        return res.status(201).json({
            message: "Job applied successfully",
            success: true
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Server error',
            success: false
        });

    }
};

export const getAppliedJobs = async (req, res) => {
    try {
        const userId = req.userId;
        const applications = await Application.find({ applicant: userId }).sort({ createdAt: -1 }).populate({
            path: 'job',
            options: { sort: { createdAt: -1 } },
            populate: {
                path: "company",
                options: { sort: { createdAt: -1 } },
            }
        });
        if (!applications) {
            return res.status(404).json({
                message: "No applications found",
                success: false
            });
        }
        return res.status(200).json({
            applications,
            success: true
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};

// admin can see all the applicants for a job
export const getApplicants = async (req, res) => {
    try {
        const jobId = req.params.id;
        const job = await Job.findById(jobId).populate({
            path: "applications",
            options: { sort: { createdAt: -1 } },
            populate: {
                path: "applicant",
                options: { sort: { createdAt: -1 } }
            }
        });
        if (!job) {
            return res.status(404).json({
                message: "Job not found",
                success: false
            });
        }
        return res.status(200).json({
            job,
            success: true
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};

export const updateApplicationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const applicationId = req.params.id;
        if (!status) {
            return res.status(400).json({
                message: "Status is required",
                success: false
            });
        }

        // find the application by application Id
        const application = await Application.findOne({ _id: applicationId });
        if (!application) {
            return res.status(404).json({
                message: "Application not found",
                success: false
            });
        }
        // update the status
        application.status = status.toLowerCase();
        await application.save();
        return res.status(200).json({
            message: "status updated successfully",
            success: true
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error",
            success: false
        });
    }
}