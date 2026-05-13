import mongoose from "mongoose";
import Course from "./models/Course.js";

const MONGO_URI = "mongodb://localhost:27017/codequest";

async function fixVideoIds() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB.");

  const courses = await Course.find();
  for (const course of courses) {
    let updated = false;
    course.videos = course.videos.map(video => {
      // If it's the old mock ID or the blocked one, update it to a very safe embeddable video
      if (video.videoId === "PkZNo7MFOUg" || video.videoId.startsWith("mock_vid_")) {
        video.videoId = "w7ejDZ8SWv8"; // React Crash Course (Guaranteed embeddable)
        updated = true;
      }
      return video;
    });

    if (updated) {
      await course.save();
      console.log(`Updated course: ${course.title}`);
    }
  }

  console.log("Finished updating courses.");
  process.exit(0);
}

fixVideoIds();
