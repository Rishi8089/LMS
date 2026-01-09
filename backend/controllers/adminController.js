import Employee from "../models/EmployeeModel.js";
import Course from "../models/CourseModel.js";
import Enrollment from "../models/EnrollmentsModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Dashboard stats
const dashboard = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const totalCourses = await Course.countDocuments();
    const mandatoryCourses = await Course.countDocuments({ mandatory: true });
    const totalEnrollments = await Enrollment.countDocuments();
    res.status(200).json({
      success: true,
      stats: {
        totalEmployees,
        totalCourses,
        mandatoryCourses,
        totalEnrollments,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin login
const adminLogin = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required" });
  }
  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign({ id: "admin", role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1d" });

    // Set cookie with consistent options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      path: "/"
    };

    // Add domain for localhost in development
    if (process.env.NODE_ENV !== "production") {
      cookieOptions.domain = "localhost";
    }

    res.cookie("adminToken", token, cookieOptions);
    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      user: { role: "admin" },
    });
  }
  return res.status(401).json({ message: "Invalid admin credentials" });
};

// Employee registration
const employeeRegister = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }
    const existing = await Employee.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Employee already exists" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const employee = await Employee.create({ name, email, phone, password: hashed });

    // Auto-enroll in mandatory courses
    const mandatoryCourses = await Course.find({ mandatory: true });
    if (mandatoryCourses.length > 0) {
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 days

      await Enrollment.insertMany(
        mandatoryCourses.map((course) => ({
          employee: employee._id,
          course: course._id,
          dueDate,
          status: "enrolled",
          progress: 0,
          quizCompleted: false,
          lessonProgress: [],
          lastAccessed: new Date()
        }))
      );

      console.log(`Auto-enrolled employee ${employee.name} in ${mandatoryCourses.length} mandatory courses`);
    }
    res.status(201).json({
      success: true,
      message:
        "Employee registered and auto-enrolled in mandatory courses successfully.",
      employee: {
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

// Get all employees
const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().select("-password");
    res.status(200).json({ success: true, employees });
  } catch (error) {
    console.error("Get all employees error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin check
const adminCheck = async (req, res) => {
  try {
    const token = req.cookies?.adminToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(200).json({ loggedIn: false });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role === "admin") {
      res.status(200).json({ loggedIn: true, user: { role: "admin" } });
    } else {
      res.status(200).json({ loggedIn: false });
    }
  } catch (err) {
    console.error("Admin check error:", err);
    res.status(200).json({ loggedIn: false });
  }
};

// Admin logout
const adminLogout = async (req, res) => {
  try {
    // Use exact same options as admin login for proper clearing
    const clearOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day (same as login)
      path: "/"
    };

    // Add domain for localhost in development (same as login)
    if (process.env.NODE_ENV !== "production") {
      clearOptions.domain = "localhost";
    }

    // Remove maxAge for clearing (browsers ignore maxAge when clearing)
    delete clearOptions.maxAge;

    // Clear the adminToken cookie with exact matching options
    res.clearCookie("adminToken", clearOptions);

    // Additional fallback clearings
    res.clearCookie("adminToken", { path: "/" });
    res.clearCookie("adminToken", { path: "/", domain: "localhost" });
    res.clearCookie("adminToken", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/"
    });

    console.log("Admin cookie cleared successfully");
    return res.status(200).json({
      success: true,
      message: "Admin logged out successfully",
    });
  } catch (err) {
    console.error("Admin logout error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during logout",
    });
  }
};

// Update Employee (Admin only)
const updateEmployee = async (req, res) => {
  try {
    console.log("🛠 Update employee request received");
    console.log("➡ Params:", req.params);
    console.log("➡ Body:", req.body);
    console.log("➡ Cookies:", req.cookies);

    const { id } = req.params;
    const { name, email, phone, password } = req.body;

    // ✅ Validate ID
    if (!id) {
      return res.status(400).json({ success: false, message: "Employee ID is required" });
    }

    const employee = await Employee.findById(id);
    if (!employee) {
      console.log("❌ Employee not found with ID:", id);
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // ✅ Update only provided fields
    if (name) employee.name = name.trim();

    if (email && email !== employee.email) {
      const existing = await Employee.findOne({ email });
      if (existing) {
        console.log("⚠️ Email already in use:", email);
        return res.status(400).json({
          success: false,
          message: "Email already in use by another employee",
        });
      }
      employee.email = email.trim().toLowerCase();
    }

    if (phone) employee.phone = phone.trim();

    // ✅ Update password if provided
    if (password && password.length > 0) {
      const hashed = await bcrypt.hash(password, 10);
      employee.password = hashed;
    }

    // ✅ Save updates
    await employee.save();

    console.log("✅ Employee updated successfully:", employee._id);

    res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
      },
    });
  } catch (error) {
    console.error("🔥 Update employee error:", error);
    res.status(500).json({ success: false, message: "Server error while updating employee" });
  }
};


// Get Employee Courses (Admin only)
const getEmployeeCourses = async (req, res) => {
  try {
    const { id } = req.params;

    // Find all enrollments for this employee and populate course data
    const enrollments = await Enrollment.find({ employee: id })
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

    res.status(200).json({
      success: true,
      courses,
    });
  } catch (error) {
    console.error("Get employee courses error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Delete Employee (Admin only)
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }
    await Employee.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
    console.error("Delete employee error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get mandatory courses
const getMandatoryCourses = async (req, res) => {
  try {
    const courses = await Course.find({ mandatory: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, courses });
  } catch (error) {
    console.error("Get mandatory courses error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get enrolled employees for a course
const getEnrolledEmployeesForCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Find all enrollments for this course and populate employee data
    const enrollments = await Enrollment.find({ course: courseId })
      .populate('employee', 'name email phone')
      .select('employee enrollmentDate dueDate status progress');

    // Transform the data to match the expected format
    const employees = enrollments.map(enrollment => ({
      name: enrollment.employee.name,
      email: enrollment.employee.email,
      phone: enrollment.employee.phone,
      enrolledCourses: [{
        enrollmentDate: enrollment.enrollmentDate,
        dueDate: enrollment.dueDate,
        status: enrollment.status,
        progress: enrollment.progress
      }]
    }));

    res.status(200).json({ success: true, employees });
  } catch (error) {
    console.error("Get enrolled employees error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Export all
export {
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
};
