import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import { 
  createProject, 
  getUserProjects, 
  getProjectById, 
  updateProject, 
  deleteProject,
  executeCode,
  pushProjectToGitHub,
  getAllPublicProjects,
  toggleLikeProject,
  rateProject,
  getProjectComments,
  addProjectComment,
  getAdminAllProjects
} from "../controllers/projectController.js";

const router = express.Router();

// Require secure authentication for all code snippet projects
router.use(protect);

router.post("/execute", executeCode);
router.post("/:id/push-github", pushProjectToGitHub);
router.get("/admin/all", admin, getAdminAllProjects);
router.get("/public", getAllPublicProjects);
router.post("/:id/like", toggleLikeProject);
router.post("/:id/rate", rateProject);
router.get("/:id/comments", getProjectComments);
router.post("/:id/comments", addProjectComment);
router.post("/", createProject);
router.get("/", getUserProjects);
router.get("/:id", getProjectById);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

export default router;
