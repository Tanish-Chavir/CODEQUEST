import Project from "../models/Project.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";
import { executeCodeSecurely } from "../services/executorService.js";
import { pushSnippetToGitHub } from "../services/githubService.js";
import { createNotificationHelper } from "./notificationController.js";

/**
 * @desc    Create a new saved code project
 * @route   POST /api/projects
 * @access  Private
 */
export const createProject = async (req, res) => {
  try {
    const { title, description, language, code } = req.body;

    if (!title || !language) {
      return res.status(400).json({ message: "title and language are required" });
    }

    const project = await Project.create({
      userId: req.user.id,
      title,
      description: description || "",
      language,
      code: code || "",
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: "Failed to create project", error: error.message });
  }
};

/**
 * @desc    Fetch all projects belonging to current user
 * @route   GET /api/projects
 * @access  Private
 */
export const getUserProjects = async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user projects", error: error.message });
  }
};

/**
 * @desc    Fetch a specific project by id
 * @route   GET /api/projects/:id
 * @access  Private
 */
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user.id });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch project", error: error.message });
  }
};

/**
 * @desc    Update a saved project (auto-saves code)
 * @route   PUT /api/projects/:id
 * @access  Private
 */
export const updateProject = async (req, res) => {
  try {
    const { title, description, code, language } = req.body;
    const project = await Project.findOne({ _id: req.params.id, userId: req.user.id });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (title) project.title = title;
    if (description !== undefined) project.description = description;
    if (code !== undefined) project.code = code;
    if (language) project.language = language;

    await project.save();
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: "Failed to save project edits", error: error.message });
  }
};

/**
 * @desc    Delete a project snippet
 * @route   DELETE /api/projects/:id
 * @access  Private
 */
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete project", error: error.message });
  }
};

/**
 * @desc    Execute code inside secure piston engine sandbox
 * @route   POST /api/projects/execute
 * @access  Private
 */
export const executeCode = async (req, res) => {
  try {
    const { language, code } = req.body;

    if (!language || !code) {
      return res.status(400).json({ message: "language and code are required" });
    }

    const result = await executeCodeSecurely(language, code);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Code compilation failed", error: error.message });
  }
};

/**
 * @desc    Push a saved project to connected GitHub repository
 * @route   POST /api/projects/:id/push-github
 * @access  Private
 */
export const pushProjectToGitHub = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user || !user.githubToken) {
      return res.status(400).json({ message: "GitHub account not authorized. Please connect in settings/editor." });
    }

    const project = await Project.findOne({ _id: req.params.id, userId: req.user.id });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Push snippet securely to repo
    const fileUrl = await pushSnippetToGitHub(
      user.githubToken,
      user.githubUsername,
      project.title,
      project.language,
      project.code
    );

    // Save generated file url inside project Mongoose schema
    project.githubLink = fileUrl;
    await project.save();

    // Award +50 XP bonus for active Git practices
    user.xp = (user.xp || 0) + 50;
    user.level = Math.floor(user.xp / 500) + 1;
    await user.save();

    createNotificationHelper(
      user._id,
      "Code Exported! 🐙",
      `Successfully committed '${project.title}' to GitHub workspace repository.`,
      "activity"
    );

    res.status(200).json({
      message: "Snippet pushed successfully to GitHub repo!",
      githubLink: fileUrl,
      user: { xp: user.xp, level: user.level }
    });

  } catch (error) {
    res.status(500).json({ message: "GitHub sync failed", error: error.message });
  }
};

// Fetch all public projects from all users
export const getAllPublicProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("userId", "username fullName level avatar")
      .sort({ createdAt: -1 })
      .limit(50);
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: "Failed to load public timeline", error: error.message });
  }
};

// Toggle like project
export const toggleLikeProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (!project.likes) project.likes = [];
    const userId = req.user.id;
    const isLiked = project.likes.includes(userId);

    if (isLiked) {
      project.likes = project.likes.filter(id => id.toString() !== userId.toString());
    } else {
      project.likes.push(userId);

      // Reward author with +10 XP for community validation
      const author = await User.findById(project.userId);
      if (author && author._id.toString() !== userId.toString()) {
        author.xp = (author.xp || 0) + 10;
        author.level = Math.floor(author.xp / 500) + 1;
        await author.save();

        createNotificationHelper(
          author._id,
          "Snippet Liked! ❤️",
          `Developer @${req.user.username} liked your code snippet '${project.title}'. (+10 XP)`,
          "activity"
        );
      }
    }

    await project.save();
    res.status(200).json({
      message: isLiked ? "Unliked successfully" : "Liked successfully",
      likesCount: project.likes.length,
      isLiked: !isLiked
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to like project", error: error.message });
  }
};

// Rate project (1 to 5 stars)
export const rateProject = async (req, res) => {
  try {
    const { rating } = req.body;
    const ratingValue = parseInt(rating, 10);
    if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5 stars" });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (!project.ratings) project.ratings = [];
    const userId = req.user.id;

    // Remove existing rating
    project.ratings = project.ratings.filter(r => r.userId.toString() !== userId.toString());

    // Add new rating
    project.ratings.push({ userId, rating: ratingValue });
    await project.save();

    // Reward author +15 XP for positive feedback (4+ stars)
    if (ratingValue >= 4) {
      const author = await User.findById(project.userId);
      if (author && author._id.toString() !== userId.toString()) {
        author.xp = (author.xp || 0) + 15;
        author.level = Math.floor(author.xp / 500) + 1;
        await author.save();

        createNotificationHelper(
          author._id,
          "Highly Rated! ⭐",
          `Developer @${req.user.username} rated your code snippet '${project.title}' ${ratingValue} stars! (+15 XP)`,
          "activity"
        );
      }
    }

    res.status(200).json({
      message: "Rated successfully",
      ratings: project.ratings
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to rate project", error: error.message });
  }
};

// Fetch comments for project
export const getProjectComments = async (req, res) => {
  try {
    const comments = await Comment.find({ projectId: req.params.id })
      .populate("userId", "username fullName avatar level")
      .sort({ timestamp: 1 });
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: "Failed to load comments", error: error.message });
  }
};

// Add comment to project
export const addProjectComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const newComment = await Comment.create({
      projectId: req.params.id,
      userId: req.user.id,
      text: text.trim()
    });

    const populated = await newComment.populate("userId", "username fullName avatar level");

    // Notification to author
    if (project.userId.toString() !== req.user.id.toString()) {
      createNotificationHelper(
        project.userId,
        "New Feedback! 💬",
        `Developer @${req.user.username} commented on your snippet '${project.title}'.`,
        "activity"
      );
    }

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Failed to submit comment", error: error.message });
  }
};

// Admin ONLY: Fetch all projects across all users
export const getAdminAllProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("userId", "username email level avatar")
      .sort({ updatedAt: -1 });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: "Failed to load all platform projects", error: error.message });
  }
};
