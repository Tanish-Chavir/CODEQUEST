import { fetchWithAuth } from "@/lib/api";

export interface Course {
  _id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
  createdAt: string;
}

/**
 * Course Service
 * Handles API calls to the /courses endpoints of CodeQuest.
 */
export const courseService = {
  /**
   * Fetch all courses
   */
  async getAllCourses(): Promise<Course[]> {
    return fetchWithAuth("/courses");
  },

  /**
   * Fetch a single course by its ID
   */
  async getCourseById(id: string): Promise<Course> {
    return fetchWithAuth(`/courses/${id}`);
  },

  /**
   * Create a new course (admin authorization typically required)
   */
  async createCourse(courseData: Omit<Course, "_id" | "createdAt">): Promise<Course> {
    return fetchWithAuth("/courses", {
      method: "POST",
      body: JSON.stringify(courseData),
    });
  },
};
