import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";
import Employee from "../models/EmployeeModel.js";
import Course from "../models/CourseModel.js";

// Unified helper function for consistent cookie settings
const cookieOptions = (days = 1) => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: days * 24 * 60 * 60 * 1000, // days * hours * minutes * seconds * milliseconds
    path: "/"
});

// Helper function for token generation
const generateToken = (employee) => {
    // Note: '1d' token lifetime is for register/login success
    return jwt.sign({ id: employee._id }, process.env.JWT_SECRET, { expiresIn: "1d" }); 
};

// --- AUTH CONTROLLERS ---

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        if (!email || !password || !name) {
            return res.status(400).json({ message: "All fields required" });
        }

        // if (!validator.isEmail(email)) {
        //     return res.status(400).json({ message: "Invalid email format" });
        // }

        // if (!validator.isStrongPassword(password)) {
        //     return res.status(400).json({ message: "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character" });
        // }
        
        const existing = await Employee.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: "Employee already exists" });
        }

        const hashed = await bcrypt.hash(password, 10);
        const employee = await Employee.create({ name, email, password: hashed });

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

        res.status(200).json({
            success: true,
            message: "Registration successful",
            user: {
                id: employee._id,
                name: employee.name,
                email: employee.email,
            },
        });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        

        const employee = await Employee.findOne({ email });
        if (!employee) return res.status(401).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, employee.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        // Token generation and cookie setting
        const token = generateToken(employee);
        res.cookie("token", token, cookieOptions(1)); // 1-day cookie

        res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: employee._id,
                name: employee.name,
                email: employee.email,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error" });
    }
};



export const logout = async (req, res) => {
    try {
        // Clear the cookie using the same options as set, without maxAge
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/"
        });

        return res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (err) {
        console.error("Logout error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error during logout",
        });
    }
};

export const me = async (req, res) => {
    try {
        const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ loggedIn: false, message: "No token provided" });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ loggedIn: false, message: "Invalid or expired token" });
        }

        const employee = await Employee.findById(decoded.id).select("-password");
        if (!employee) {
            return res.status(404).json({ loggedIn: false, message: "User not found" });
        }

        res.status(200).json({
            loggedIn: true,
            user: employee,
        });
    } catch (err) {
        console.error("me controller error:", err.message);
        res.status(500).json({
            loggedIn: false,
            message: "Server error",
        });
    }
};

export const check = async (req, res) => {
    try {
        const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(200).json({ loggedIn: false });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const employee = await Employee.findById(decoded.id).select("-password");

        if (!employee) {
            return res.status(200).json({ loggedIn: false });
        }

        res.status(200).json({ loggedIn: true, user: employee });
    } catch (err) {
        // Return loggedIn: false on any token/auth failure, but keep status 200
        console.error("Check auth error:", err);
        res.status(200).json({ loggedIn: false });
    }
};
