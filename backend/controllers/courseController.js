import Course from "../models/Course.js";
import User from "../models/User.js";
import ytpl from "ytpl";

export const createCourse = async (req, res) => {
  try {
    const { playlistUrl } = req.body;

    if (!playlistUrl) {
      return res.status(400).json({ message: "Playlist URL is required" });
    }

    // Check if playlist exists in DB to prevent duplicates
    const existingCourse = await Course.findOne({ playlistUrl });
    if (existingCourse) {
      return res.status(200).json({ message: "Course already exists", course: existingCourse });
    }

    // Fetch playlist data using ytpl
    let playlist;
    try {
      playlist = await ytpl(playlistUrl, { limit: 10 });
    } catch (ytError) {
      console.log("ytpl failed, checking if it's a single video URL...");
      
      // Try to extract a single video ID from the URL
      const singleVideoId = playlistUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];

      if (singleVideoId) {
        playlist = {
          title: "Custom AI Video Lesson",
          url: playlistUrl,
          bestThumbnail: { url: `https://img.youtube.com/vi/${singleVideoId}/hqdefault.jpg` },
          items: [{
            id: singleVideoId,
            title: "Custom YouTube Lesson",
            duration: "Unknown",
            thumbnails: [{ url: `https://img.youtube.com/vi/${singleVideoId}/hqdefault.jpg` }]
          }]
        };
      } else {
        console.log("Completely invalid URL, falling back to mock data for testing.");
        // Fallback Mock Data for testing the UI flow
        playlist = {
          title: "Mock AI Generated Course",
          url: playlistUrl,
          bestThumbnail: { url: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80" },
        items: Array.from({ length: 5 }).map((_, i) => ({
          id: "w7ejDZ8SWv8", // Safe, embeddable React Crash Course ID
          title: `Lesson ${i + 1}: Interactive Coding Concepts`,
          duration: "10:00",
          thumbnails: [{ url: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80" }]
        }))
      };
    }
    }
    
    if (!playlist || !playlist.items || playlist.items.length === 0) {
      return res.status(400).json({ message: "Could not fetch playlist or it is empty" });
    }

    const videos = playlist.items.map((item, index) => ({
      videoId: item.id,
      title: item.title,
      duration: item.duration || "Unknown",
      thumbnail: item.thumbnails[0]?.url || "",
      order: index + 1,
    }));

    const newCourse = new Course({
      title: playlist.title,
      playlistUrl: playlist.url,
      thumbnail: playlist.bestThumbnail?.url || videos[0]?.thumbnail || "",
      creator: req.user.id, // from protect middleware
      videos,
    });

    await newCourse.save();

    res.status(201).json({ message: "Course created successfully", course: newCourse });
  } catch (error) {
    res.status(500).json({ message: "Error creating course", error: error.message });
  }
};

export const getCourses = async (req, res) => {
  try {
    // Return courses created by the user OR old courses that don't have a creator field yet
    const courses = await Course.find({
      $or: [
        { creator: req.user.id },
        { creator: { $exists: false } },
        { creator: null }
      ]
    }).select("-videos");
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: "Error fetching courses", error: error.message });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.status(200).json(course);
  } catch (error) {
    res.status(500).json({ message: "Error fetching course", error: error.message });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Only allow deletion if the user is the creator OR is an admin
    const user = await User.findById(req.user.id);
    const isCreator = course.creator && course.creator.toString() === req.user.id;
    const isAdmin = user && user.role === "admin";

    if (!isCreator && !isAdmin && course.creator) {
      return res.status(403).json({ message: "You are not authorized to delete this course" });
    }

    await Course.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting course", error: error.message });
  }
};
