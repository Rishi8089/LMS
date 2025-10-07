import Employee from '../models/EmployeeModel.js';
import Course from '../models/CourseModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Unified helper function for consistent cookie settings
const cookieOptions = (days = 1) => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: days * 24 * 60 * 60 * 1000,
});

// Helper function for token generation
const generateToken = (employee) => {
    return jwt.sign({ id: employee._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

const dashboard = async (req, res) => {
    try {
        const totalEmployees = await Employee.countDocuments();
        const totalCourses = await Course.countDocuments();
        const mandatoryCourses = await Course.countDocuments({ mandatory: true });
        const enrolledCourses = await Employee.aggregate([
            { $unwind: "$enrolledCourses" },
            { $group: { _id: null, totalEnrollments: { $sum: 1 } } }
        ]);
        const totalEnrollments = enrolledCourses.length > 0 ? enrolledCourses[0].totalEnrollments : 0;

        res.status(200).json({
            success: true,
            stats: {
                totalEmployees,
                totalCourses,
                mandatoryCourses,
                totalEnrollments
            }
        });
    } catch (error) {
        console.error("Dashboard error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const adminLogin = (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
        return res.status(200).json({ message: "Admin login successful" });
    }
    return res.status(401).json({ message: "Invalid admin credentials" });
};

const employeeRegister = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        if (!email || !password || !phone || !name) {
            return res.status(400).json({ message: "All fields required" });
        }

        const existing = await Employee.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: "Employee already exists" });
        }

        const hashed = await bcrypt.hash(password, 10);
        const employee = await Employee.create({ name, email, phone, password: hashed });

        // Auto-Enrollment for Mandatory Courses
        const mandatoryCourses = await Course.find({ mandatory: true });

        if (mandatoryCourses.length > 0) {
            const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
            employee.enrolledCourses = mandatoryCourses.map(course => ({
                course: course._id,
                dueDate: dueDate
            }));
            await employee.save();
        }

        // Token generation and cookie setting
        const token = generateToken(employee);
        res.cookie("token", token, cookieOptions(1)); // 1-day cookie

        res.status(201).json({
            success: true,
            message: "Employee registered and auto-enrolled in mandatory courses successfully.",
            employee: {
                id: employee._id,
                name: employee.name,
                email: employee.email
            }
        });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const getAllEmployees = async (req, res) => {
    try {
        const employees = await Employee.find().select("-password");
        res.status(200).json({ success: true, employees });
    } catch (error) {
        console.error("Get all employees error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export { dashboard, adminLogin, employeeRegister, getAllEmployees };
