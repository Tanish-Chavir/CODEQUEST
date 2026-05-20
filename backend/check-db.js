import mongoose from "mongoose";
import Course from "./models/Course.js";

const MONGO_URI = "mongodb://localhost:27017/codequest";

async function check() {
  await mongoose.connect(MONGO_URI);
  const course = await Course.findById("69fe30536422cbad91bfe1f6");
  console.log(JSON.stringify(course, null, 2));
  process.exit(0);
}

check();
