import express from "express";
import {
  addEmployee,
  enrollCourse,
  getEmployeeById,
  enrolledCourses,
  getCurrentEmployee,
  checkEnrollment,
  updateLessonProgress,
  getCourseQuiz,
  submitQuiz,
} from "../controllers/employeeController.js";
import { isAuth } from "../middleware/isAuth.js";
import Employee from "../models/EmployeeModel.js";

const employeeRoute = express.Router();

// ✅ Add new employee
employeeRoute.post("/add-employee", addEmployee);

// ✅ Get currently logged-in employee (requires token)
employeeRoute.get("/current-employee", isAuth, getCurrentEmployee);

// ✅ Enroll in a course (employeeId = :id)
employeeRoute.post("/enroll-course/:id", enrollCourse);

// ✅ Get all enrolled courses for a specific employee (by ID)
employeeRoute.get("/employee/:id/courses", async (req, res) => {
  try {
    // Find all enrollments for this employee and populate course data
    const enrollments = await Enrollment.find({ employee: req.params.id })
      .populate('course', 'title description hours difficulty mandatory')
      .select('course enrollmentDate dueDate status progress');

    if (!enrollments) {
      return res.status(404).json({ success: false, message: "No enrollments found for this employee" });
    }

    const courses = enrollments
      .filter(enrollment => enrollment.course) // Filter out any null courses
      .map(enrollment => ({
        _id: enrollment.course._id,
        title: enrollment.course.title,
        description: enrollment.course.description,
        hours: enrollment.course.hours,
        difficulty: enrollment.course.difficulty,
        mandatory: enrollment.course.mandatory,
        enrollmentDate: enrollment.enrollmentDate,
        dueDate: enrollment.dueDate,
        status: enrollment.status,
        progress: enrollment.progress,
      }));

    res.json({ success: true, courses });
  } catch (err) {
    console.error("Error fetching enrolled courses:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Check if employee is enrolled in a particular course
employeeRoute.get("/check-enrollment/:employeeId/:courseId", checkEnrollment);

// ✅ Get all enrolled courses for the logged-in employee
employeeRoute.get("/enrolled-courses", isAuth, enrolledCourses);

// ✅ Update lesson progress
employeeRoute.post("/update-lesson-progress", isAuth, updateLessonProgress);

// ✅ Get quiz for a course
employeeRoute.get("/courses/:courseId/quiz", isAuth, getCourseQuiz);

// ✅ Submit quiz answers
employeeRoute.post("/courses/:courseId/quiz/submit", isAuth, submitQuiz);

// ✅ Get employee by ID (keep this last to avoid route conflicts)
employeeRoute.get("/:id", getEmployeeById);

export default employeeRoute;
