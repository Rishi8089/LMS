import Course from "../models/CourseModel.js";
import Employee from "../models/EmployeeModel.js";
import Enrollment from "../models/EnrollmentsModel.js";

import multer from "multer";
import path from "path";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import ffprobeStatic from "ffprobe-static";

// --- CONFIGURATION & HELPERS ---

// Set ffprobe path
ffmpeg.setFfprobePath(ffprobeStatic.path);

// Helper: Get video duration
const getVideoDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.error("Error getting video duration:", err);
        reject(err);
      } else {
        const duration = metadata.format.duration;
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        const formattedDuration = `${minutes}:${seconds.toString().padStart(2, "0")}`;
        resolve(formattedDuration);
      }
    });
  });
};

// Helper: Parse duration string (MM:SS or HH:MM:SS) to seconds
function parseDuration(durationStr) {
  if (!durationStr) return 0;
  const parts = durationStr.split(":").map(Number);
  let seconds = 0;
  if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  else if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
  else if (parts.length === 1) seconds = parts[0];
  return seconds;
}

// Helper: Enroll all employees (used for mandatory courses)
const enrollAllEmployeesInCourse = async (courseId, dueDate) => {
  try {
    const employees = await Employee.find();
    
    // We update employees one by one to ensure safety, or use bulkWrite for performance
    // For now, simpler loop approach:
    for (const employee of employees) {
      const alreadyEnrolled = employee.enrolledCourses.some(
        (enrolled) => enrolled.course.toString() === courseId.toString()
      );

      if (!alreadyEnrolled) {
        employee.enrolledCourses.push({
          course: courseId,
          enrollmentDate: new Date(),
          dueDate: dueDate,
          status: "enrolled",
          progress: 0,
          lessonProgress: [],
          completedLessons: 0,
          totalLessons: 0,
        });
        await employee.save();
      }
    }
    console.log(`Auto-enrolled employees in course: ${courseId}`);
  } catch (error) {
    console.error("Error enrolling employees:", error);
  }
};

// Helper: Get file URL
function getFileUrl(filename) {
  return `/uploads/${filename}`;
}

// --- MULTER SETUP ---

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, "_");
    cb(null, `${basename}-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

export const uploadCourseFiles = upload.fields([
  { name: "images", maxCount: 1 },
  { name: "files", maxCount: 200 }, // Generic bucket for lesson videos/PDFs
]);

// --- CONTROLLERS ---

/**
 * ✅ Create a new course
 */
export const createCourse = [
  uploadCourseFiles,
  async (req, res) => {
    try {
      const { title, description, hours, difficulty, mandatory, chapters, quiz, dueDate } = req.body;

      // 1. Validation
      if (!title || !description || !hours || !difficulty) {
        return res.status(400).json({ success: false, message: "All required fields must be filled" });
      }

      const existingCourse = await Course.findOne({ title: title.trim() });
      if (existingCourse) {
        return res.status(400).json({ success: false, message: "A course with this title already exists" });
      }

      // 2. Parse Chapters JSON
      let parsedChapters = [];
      if (chapters) {
        try {
          parsedChapters = JSON.parse(chapters);
          if (!Array.isArray(parsedChapters)) parsedChapters = [];
        } catch (e) {
          return res.status(400).json({ success: false, message: "Invalid chapters format" });
        }
      }

      // 3. Parse Quiz JSON
      let parsedQuiz = {};
      if (quiz) {
        try {
          parsedQuiz = JSON.parse(quiz);
          if (parsedQuiz.questions && !Array.isArray(parsedQuiz.questions)) {
             return res.status(400).json({ success: false, message: "Quiz questions must be an array" });
          }
        } catch (e) {
          return res.status(400).json({ success: false, message: "Invalid quiz format" });
        }
      }

      // 4. Handle Course Image
      let imageUrl = "";
      if (req.files && req.files.images && req.files.images[0]) {
        imageUrl = getFileUrl(req.files.images[0].filename);
      }

      // 5. Handle Lesson Files (Videos/PDFs) & Logic
      const uploadedFilesQueue = req.files.files || [];
      
      // Sort logic (optional, dependent on how strictly you want to enforce UI order)
      parsedChapters = parsedChapters.map(chapter => ({
         ...chapter,
         lessons: (chapter.lessons || []) // Keep UI order
      }));

      // Process files matching
      if (parsedChapters.length > 0 && uploadedFilesQueue.length > 0) {
        let fileIndex = 0;
        parsedChapters = await Promise.all(
          parsedChapters.map(async (chapter) => ({
            ...chapter,
            lessons: await Promise.all(
              (chapter.lessons || []).map(async (lesson) => {
                // If frontend marked this lesson as having a new file (video === true)
                if (lesson.video === true && uploadedFilesQueue[fileIndex]) {
                  const file = uploadedFilesQueue[fileIndex++];
                  const filePath = path.join(uploadDir, file.filename);

                  // Extract duration if it's a video
                  let actualDuration = lesson.duration || "0:00";
                  if (file.mimetype && file.mimetype.startsWith("video/")) {
                    try {
                      actualDuration = await getVideoDuration(filePath);
                    } catch (error) {
                      console.error("Failed to extract duration:", error);
                    }
                  }

                  return {
                    ...lesson,
                    video: getFileUrl(file.filename),
                    duration: actualDuration,
                  };
                }
                return lesson; // Return existing data if no file upload
              })
            ),
          }))
        );
      }

      // 6. Calculate Total Duration
      let totalDurationSeconds = 0;
      parsedChapters.forEach((chapter) => {
        (chapter.lessons || []).forEach((lesson) => {
          totalDurationSeconds += parseDuration(lesson.duration);
        });
      });
      const calculatedHours = +(totalDurationSeconds / 3600).toFixed(2);

      // 7. Create Course Object
      const courseData = {
        title: title.trim(),
        description,
        hours: calculatedHours > 0 ? calculatedHours : Number(hours),
        difficulty,
        mandatory: mandatory === "true" || mandatory === true,
        dueDate: dueDate || null, 
        images: imageUrl,
        chapters: parsedChapters,
        quiz: parsedQuiz,
      };

      const newCourse = await Course.create(courseData);

      // 8. Auto-Enrollment for Mandatory Courses
      if (newCourse.mandatory) {
        const enrollmentDueDate = dueDate ? new Date(dueDate) : null;
        // Don't await strictly to avoid blocking response, or await if critical
        enrollAllEmployeesInCourse(newCourse._id, enrollmentDueDate);
      }

      res.status(201).json({
        success: true,
        message: "Course created successfully",
        course: newCourse,
      });

    } catch (error) {
      console.error("Create Course Error:", error);
      res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
  },
];

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
export const updateCourse = [
  uploadCourseFiles,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, hours, difficulty, mandatory, chapters, quiz, dueDate } = req.body;

      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ success: false, message: "Invalid course ID" });
      }

      const currentCourse = await Course.findById(id);
      if (!currentCourse) {
        return res.status(404).json({ success: false, message: "Course not found" });
      }

      // Check Mandatory Status Change
      const wasMandatory = currentCourse.mandatory;
      const isNowMandatory = mandatory !== undefined 
        ? (mandatory === "true" || mandatory === true) 
        : wasMandatory;

      // Parse JSON fields
      let parsedChapters = currentCourse.chapters || [];
      if (chapters) {
        try {
          parsedChapters = JSON.parse(chapters);
        } catch (e) {
          return res.status(400).json({ success: false, message: "Invalid chapters format" });
        }
      }

      let parsedQuiz = currentCourse.quiz || {};
      if (quiz) {
        try {
          parsedQuiz = JSON.parse(quiz);
        } catch (e) {
          return res.status(400).json({ success: false, message: "Invalid quiz format" });
        }
      }

      // Handle Image Update
      let updatedImageUrl = currentCourse.images;
      if (req.files && req.files.images && req.files.images[0]) {
        updatedImageUrl = getFileUrl(req.files.images[0].filename);
      }

      // Handle File Updates in Lessons
      const uploadedFilesQueue = req.files.files || [];
      
      if (parsedChapters.length > 0 && uploadedFilesQueue.length > 0) {
        let fileIndex = 0;
        parsedChapters = await Promise.all(
          parsedChapters.map(async (chapter) => ({
            ...chapter,
            lessons: await Promise.all(
              (chapter.lessons || []).map(async (lesson) => {
                // If it's a boolean true, it means a NEW file was uploaded
                if (lesson.video === true && uploadedFilesQueue[fileIndex]) {
                  const file = uploadedFilesQueue[fileIndex++];
                  const filePath = path.join(uploadDir, file.filename);
                  
                  let actualDuration = lesson.duration || "0:00";
                  if (file.mimetype && file.mimetype.startsWith('video/')) {
                    try {
                      actualDuration = await getVideoDuration(filePath);
                    } catch (error) { console.error(error); }
                  }

                  return {
                    ...lesson,
                    video: getFileUrl(file.filename),
                    duration: actualDuration,
                  };
                }
                // If it's a string, keep the old URL. If it's empty/null, keep as is.
                return lesson;
              })
            ),
          }))
        );
      }

      // Recalculate Duration
      let totalDurationSeconds = 0;
      parsedChapters.forEach((chapter) => {
        (chapter.lessons || []).forEach((lesson) => {
          totalDurationSeconds += parseDuration(lesson.duration);
        });
      });
      const calculatedHours = +(totalDurationSeconds / 3600).toFixed(2);

      // Perform Update
      const updatedCourse = await Course.findByIdAndUpdate(
        id,
        {
          title: title ? title.trim() : currentCourse.title,
          description: description || currentCourse.description,
          hours: calculatedHours > 0 ? calculatedHours : (hours ? Number(hours) : currentCourse.hours),
          difficulty: difficulty || currentCourse.difficulty,
          mandatory: isNowMandatory,
          dueDate: dueDate || currentCourse.dueDate,
          images: updatedImageUrl,
          chapters: parsedChapters,
          quiz: parsedQuiz,
        },
        { new: true, runValidators: true }
      );

      // Trigger enrollment if changed to mandatory
      if (isNowMandatory && !wasMandatory) {
        const enrollmentDueDate = dueDate ? new Date(dueDate) : null;
        enrollAllEmployeesInCourse(id, enrollmentDueDate);
      }

      res.status(200).json({ success: true, course: updatedCourse });

    } catch (err) {
      console.error("Update Course Error:", err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  },
];

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

    // Optional: Add logic here to remove related files from /uploads to save space

    res.status(200).json({ success: true, message: "Course deleted successfully" });
  } catch (err) {
    console.error("Delete Course Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ✅ Get quiz attempts for a course
 */
export const getQuizAttemptsForCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!courseId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: "Invalid course ID" });
    }

    // Find all enrollments for the course and populate employee data
    const enrollments = await Enrollment.find({ course: courseId })
      .populate('employee', 'name email')
      .select('employee quizAttempts');

    if (!enrollments || enrollments.length === 0) {
      return res.status(404).json({ success: false, message: "No enrollments found for this course" });
    }

    // Transform the data to include employee info with their quiz attempts
    const quizAttempts = enrollments
      .filter(enrollment => enrollment.quizAttempts && enrollment.quizAttempts.length > 0)
      .map(enrollment => ({
        employee: {
          _id: enrollment.employee._id,
          name: enrollment.employee.name,
          email: enrollment.employee.email
        },
        attempts: enrollment.quizAttempts
      }));

    res.status(200).json({ success: true, quizAttempts });
  } catch (err) {
    console.error("Get Quiz Attempts Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
