import express from 'express';
import {
  dashboard,
  adminLogin,
  employeeRegister,
  getAllEmployees,
  adminCheck,
  adminLogout,
  updateEmployee,
  getEmployeeCourses,
  deleteEmployee,
  getMandatoryCourses,
  getEnrolledEmployeesForCourse,
} from '../controllers/adminController.js';
import { createCourse, getCourses, updateCourse, deleteCourse } from '../controllers/courseController.js';
import isAdmin from '../middleware/isAdmin.js';

const adminRoute = express.Router();

// Admin login route
adminRoute.post('/login', adminLogin);

// Admin logout route
adminRoute.post('/logout', adminLogout);

// Admin session check route
adminRoute.get('/check', adminCheck);

// Dashboard stats route (protected)
adminRoute.get('/dashboard', isAdmin, dashboard);

// Employee management routes (protected)
adminRoute.post('/employee-register', isAdmin, employeeRegister);
adminRoute.get('/employees', isAdmin, getAllEmployees);
adminRoute.put('/employee/:id', isAdmin, updateEmployee);
adminRoute.delete('/employee/:id', isAdmin, deleteEmployee);
adminRoute.get('/employee/:id/courses', isAdmin, getEmployeeCourses);

// Course management routes (protected)
adminRoute.post('/courses', isAdmin, createCourse);
adminRoute.get('/courses', isAdmin, getCourses);
adminRoute.put('/courses/:id', isAdmin, updateCourse);
adminRoute.delete('/courses/:id', isAdmin, deleteCourse);

// Mandatory courses and enrollments routes (protected)
adminRoute.get('/mandatory-courses', isAdmin, getMandatoryCourses);
adminRoute.get('/course/:courseId/enrolled-employees', isAdmin, getEnrolledEmployeesForCourse);

export default adminRoute;
