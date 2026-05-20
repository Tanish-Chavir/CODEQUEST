import express from "express";
import mongoose from "mongoose";

const router = express.Router();

router.get("/", (req, res) => {
  const readyState = mongoose.connection.readyState;
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  };

  // Mask sensitive parts of MONGO_URI for security
  let maskedUri = "Not defined";
  if (process.env.MONGO_URI) {
    try {
      const rawUri = process.env.MONGO_URI;
      // Mask password in mongodb://username:password@host/database pattern
      maskedUri = rawUri.replace(/:([^:@]+)@/, ":******@");
    } catch (e) {
      maskedUri = "Error masking URI";
    }
  } else {
    maskedUri = "Using default fallback (localhost)";
  }

  res.json({
    status: "running",
    database: {
      state: states[readyState] || "unknown",
      readyState,
      uri: maskedUri
    }
  });
});

export default router;
