// 

import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if the Authorization header exists
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Malformed token" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach decoded info to request object

    next(); // Continue to the next middleware or route handler
  } catch (err) {
    console.error("Authentication error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
