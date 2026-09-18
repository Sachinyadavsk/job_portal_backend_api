import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                status: "error",
                message: "Access denied. No token provided."
            });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "mysecretkey"
        );

        // Make both available
        req.user = decoded;
        req.userId = decoded.userId;
        next();

    } catch (error) {
        console.error("Auth Error:", error);
        return res.status(401).json({
            status: "error",
            message: "Invalid or expired token"
        });
    }
};

export default authMiddleware;

