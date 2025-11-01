import Course from "../models/CourseModel.js";

/**
 * ✅ Create a new course
 */
export const createCourse = async (req, res) => {
  try {
    const { title, description, hours, difficulty, mandatory, images } = req.body;

    if (!title || !description || !hours || !difficulty) {
      return res
        .status(400)
        .json({ success: false, message: "All required fields must be filled" });
    }

    const existingCourse = await Course.findOne({ title });
    if (existingCourse) {
      return res
        .status(400)
        .json({ success: false, message: "A course with this title already exists" });
    }

    const course = await Course.create({
      title: title.trim(),
      description,
      hours,
      difficulty,
      mandatory: mandatory ?? false,
      images: images || [],
    });

    res.status(201).json({ success: true, course });
  } catch (err) {
    console.error("Create Course Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ✅ Get all courses
 */
export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, courses });
  } catch (err) {
    console.error("Get Courses Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ✅ Get single course by ID
 */
export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: "Invalid course ID" });
    }

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    res.status(200).json({ success: true, course });
  } catch (err) {
    console.error("Get Course by ID Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ✅ Update a course
 */
export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, hours, difficulty, mandatory, images } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: "Invalid course ID" });
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      {
        ...(title && { title: title.trim() }),
        ...(description && { description }),
        ...(hours && { hours }),
        ...(difficulty && { difficulty }),
        ...(mandatory !== undefined && { mandatory }),
        ...(images && { images }),
      },
      { new: true, runValidators: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    res.status(200).json({ success: true, course: updatedCourse });
  } catch (err) {
    console.error("Update Course Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ✅ Delete a course
 */
export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: "Invalid course ID" });
    }

    const course = await Course.findByIdAndDelete(id);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    res.status(200).json({ success: true, message: "Course deleted successfully" });
  } catch (err) {
    console.error("Delete Course Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
