import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Employee from "../models/EmployeeModel.js";

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 1000 * 60 * 60 * 24, // 1 day
});

const generateToken = (employee) => {
  return jwt.sign({ id: employee._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password || !name) return res.status(400).json({ message: "All fields required" });

    const existing = await Employee.findOne({ email });
    if (existing) return res.status(400).json({ message: "Employee already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const employee = await Employee.create({ name, email, password: hashed });

    const token = generateToken(employee);
    res.cookie("token", token, cookieOptions());
    res.status(201).json({ success: true, employee: { id: employee._id, email: employee.email, name: employee.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Find employee
    const employee = await Employee.findOne({ email });
    if (!employee) return res.status(401).json({ message: "Invalid email or password" });

    // 2️⃣ Check password
    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    // 3️⃣ Create JWT
    const token = jwt.sign({ id: employee._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // 4️⃣ Send cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 5️⃣ Return user info (optional)
    res.status(200).json({
      message: "Login successful",
      user: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
      },
      token, // optional if you want localStorage version too
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = async (req, res) => {
  try {
    // Clear the cookie

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
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
    // ✅ First try cookie, then fallback to Authorization header
    const token =
      req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ loggedIn: false, message: "No token provided" });
    }

    // ✅ Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res
        .status(401)
        .json({ loggedIn: false, message: "Invalid or expired token" });
    }

    // ✅ Fetch employee (exclude password)
    const employee = await Employee.findById(decoded.id).select("-password");
    if (!employee) {
      return res
        .status(404)
        .json({ loggedIn: false, message: "User not found" });
    }

    // ✅ Success
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
    const token =
      req.cookies?.token || req.headers.authorization?.split(" ")[1];
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
    console.error("Check auth error:", err);
    res.status(200).json({ loggedIn: false });
  }
};