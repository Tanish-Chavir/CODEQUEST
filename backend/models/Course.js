import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  playlistUrl: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  videos: [{
    videoId: String,
    title: String,
    duration: String,
    thumbnail: String,
    order: Number,
  }],
  enrolledUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }]
}, { timestamps: true });

export default mongoose.model("Course", courseSchema);
