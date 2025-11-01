import express from "express";
import {
  addEmployee,
  enrollCourse,
  getEmployeeById,
  enrolledCourses,
  getCurrentEmployee,
  checkEnrollment,
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
    const employee = await Employee.findById(req.params.id).populate("enrolledCourses");
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    res.json({ success: true, courses: employee.enrolledCourses });
  } catch (err) {
    console.error("Error fetching enrolled courses:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Check if employee is enrolled in a particular course
employeeRoute.get("/check-enrollment/:employeeId/:courseId", checkEnrollment);

// ✅ Get all enrolled courses for the logged-in employee
employeeRoute.get("/enrolled-courses", isAuth, enrolledCourses);

// ✅ Get employee by ID (keep this last to avoid route conflicts)
employeeRoute.get("/:id", getEmployeeById);

export default employeeRoute;
