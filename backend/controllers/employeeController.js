import Employee from "../models/EmployeeModel.js";
import Course from "../models/CourseModel.js";
import { isAuth } from "../middleware/isAuth.js";


export const getCurrentEmployee = async (req, res) => {

    try {
        const employee = await Employee.findById(req.employee.id).select("-password");
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }
        res.status(200).json({ success: true, employee });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });

    }
};


export const addEmployee = async (req, res) => {
    try {
        const { name, email } = req.body;
        if (!name || !email) {
            return res.status(400).json({ message: "Name and email are required" });
        }
        const existingEmployee = await Employee.findOne({ email });
        if (existingEmployee) {
            return res.status(400).json({ message: "Employee with this email already exists" });
        }
        const employee = await Employee.create({ name, email });
        res.status(201).json({ success: true, employee });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
export const getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await Employee.findById(id).populate('enrolledCourses.course');
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }
        res.status(200).json({ success: true, employee });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
export const enrollCourse = async (req, res) => {
    try {
        const { id } = req.params; // Employee ID
        const { courseId } = req.body; // Course ID to enroll
        const employee = await Employee.findById(id);
        const course = await Course.findById(courseId);
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }
        if (employee.enrolledCourses.some(ec => ec.course.toString() === courseId)) {
            return res.status(400).json({ message: "Already enrolled in this course" });
        }
        const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
        employee.enrolledCourses.push({ course: courseId, dueDate: dueDate });
        await employee.save();
        res.status(200).json({ success: true, message: "Enrolled successfully", employee });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const enrolledCourses = async (req, res) => {
    try {
        const id = req.employee.id;

        // Find employee and populate enrolled courses
        const employee = await Employee.findById(id).populate("enrolledCourses.course");

        if (!employee) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }

        res.status(200).json({
            success: true,
            courses: employee.enrolledCourses || []
        });
    } catch (err) {
        console.error("Error fetching enrolled courses:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
