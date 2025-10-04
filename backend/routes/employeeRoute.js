import express from "express";
import {
  addEmployee,
  enrollCourse,
  getEmployeeById,
  enrolledCourses,
  getCurrentEmployee,
} from "../controllers/employeeController.js";
import { isAuth } from "../middleware/isAuth.js";

const employeeRoute = express.Router();

// Routes
employeeRoute.post("/add-employee", addEmployee);
employeeRoute.get("/current-employee", isAuth, getCurrentEmployee);

// ✅ Enroll in a course
employeeRoute.post("/enroll-course/:id", enrollCourse);

// ✅ Get all enrolled courses for an employee
employeeRoute.get("/enrolled-courses",enrolledCourses);


employeeRoute.get("/:id", getEmployeeById); // keep last

export default employeeRoute;
