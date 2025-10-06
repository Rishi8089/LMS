import Course from "../models/CourseModel.js";


export const createCourse = async (req, res) => {
    try {
        const { title, description, hours, difficulty, mandatory, images } = req.body;
        if (!title || !description || !hours || !difficulty) {
            return res.status(400).json({ message: "All required fields must be filled" });
        }
        const course = await Course.create({ title, description, hours, difficulty, mandatory, images });
        res.status(201).json({ success: true, course });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
        console.log(err);
    }
};


export const getCourses = async (req, res) => {
    try {
        const courses = await Course.find();
        res.status(200).json({ success: true, courses });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const getCourseById = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }
        res.status(200).json({ success: true, course });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, hours, difficulty, mandatory, images } = req.body;
        const course = await Course.findByIdAndUpdate(id, { title, description, hours, difficulty, mandatory, images }, { new: true });
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }
        res.status(200).json({ success: true, course });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await Course.findByIdAndDelete(id);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }
        res.status(200).json({ success: true, message: "Course deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

