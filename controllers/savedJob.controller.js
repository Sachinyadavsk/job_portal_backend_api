import SavedJob from "../models/savedJob.model.js";
import Job from "../models/job.model.js";

// SAVE JOB
export const saveJob = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { jobId } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }

        if (!jobId) {
            return res.status(400).json({
                success: false,
                message: "Job ID is required"
            });
        }

        // Check job
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        // Check already saved
        const existingSavedJob = await SavedJob.findOne({
            user: userId,
            job: jobId
        });

        if (existingSavedJob) {
            return res.status(400).json({
                success: false,
                message: "Job already saved"
            });
        }

        const savedJob = await SavedJob.create({
            user: userId,
            job: jobId
        });

        return res.status(201).json({
            success: true,
            message: "Job saved successfully",
            savedJob
        });

    } catch (error) {
        console.error("Save Job Error:",error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// UNSAVE JOB
export const unsaveJob = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { jobId } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }

        if (!jobId) {
            return res.status(400).json({
                success: false,
                message: "Job ID is required"
            });
        }

        const savedJob =
            await SavedJob.findOneAndDelete({
                user: userId,
                job: jobId
            });

        if (!savedJob) {
            return res.status(404).json({
                success: false,
                message: "Saved job not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Job removed from saved jobs"
        });

    } catch (error) {
        console.error("Unsave Job Error:",error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// GET LOGGED USER SAVED JOBS
export const getSavedJobs = async (req, res) => {
    try {
        const userId = req.user.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }

        const savedJobs =await SavedJob.find({user: userId}).populate({path: "job",
                    populate: {
                        path: "company"
                    }
                })
                .sort({createdAt: -1});

        return res.status(200).json({
            success: true,
            count: savedJobs.length,
            savedJobs
        });

    } catch (error) {
        console.error("Get Saved Jobs Error:",error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// CHECK JOB SAVED OR NOT
export const checkSavedJob = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { jobId } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }

        const savedJob =
            await SavedJob.findOne({
                user: userId,
                job: jobId
            });

        return res.status(200).json({
            success: true,
            isSaved: !!savedJob
        });

    } catch (error) {
        console.error( "Check Saved Job Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};