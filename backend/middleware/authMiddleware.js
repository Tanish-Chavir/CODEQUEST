import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
      
      req.user = decoded; // { id: "..." }
      next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

export const admin = async (req, res, next) => {
  if (req.user && req.user.id) {
    try {
      const user = await User.findById(req.user.id);
      if (user && user.role === "admin") {
        next();
      } else {
        res.status(403).json({ message: "Not authorized as an admin" });
      }
    } catch (error) {
      res.status(500).json({ message: "Admin authorization check failed", error: error.message });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no user info" });
  }
};

