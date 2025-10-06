import Enrollment from "../models/EnrollmentModel.js";

export const enrolledCourses = async (req, res) => {
    try {
        const employeeId = req.employee.id; // From isAuth middleware
        const enrollments = await Enrollment.find({ employee: employeeId }).populate('course');
        const courses = enrollments.map(enrollment => enrollment.course);
        res.status(200).json({ success: true, courses });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};