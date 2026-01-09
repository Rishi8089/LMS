import Employee from "../models/EmployeeModel.js";
import Course from "../models/CourseModel.js";
import Enrollment from "../models/EnrollmentsModel.js";
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

        // Create the employee
        const employee = await Employee.create({ name, email });

        // Find all mandatory courses
        const mandatoryCourses = await Course.find({ mandatory: true });

        // Enroll employee in all mandatory courses
        for (const course of mandatoryCourses) {
            try {
                // Calculate due date (30 days from enrollment)
                const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                // Create enrollment record
                const enrollment = await Enrollment.create({
                    employee: employee._id,
                    course: course._id,
                    dueDate: dueDate,
                    status: 'enrolled',
                    progress: 0,
                    quizCompleted: false,
                    enrollmentDate: new Date(),
                    lastAccessed: new Date()
                });

                console.log(`Auto-enrolled employee ${employee.name} in mandatory course: ${course.title} (Enrollment ID: ${enrollment._id})`);
            } catch (enrollmentError) {
                console.error(`Failed to enroll employee ${employee.name} in course ${course.title}:`, enrollmentError);
            }
        }

        res.status(201).json({
            success: true,
            employee: employee,
            message: `Employee created and enrolled in ${mandatoryCourses.length} mandatory courses`
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
export const getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await Employee.findById(id);
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
        const { courseId, daysToComplete } = req.body; // Course ID and optional days to complete
        const employee = await Employee.findById(id);
        const course = await Course.findById(courseId);
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Check if already enrolled using Enrollment model
        const existingEnrollment = await Enrollment.findOne({ employee: id, course: courseId });
        if (existingEnrollment) {
            return res.status(400).json({ message: "Already enrolled in this course" });
        }

        // Use daysToComplete or default to 30 days
        const days = (typeof daysToComplete === 'number' && daysToComplete > 0) ? daysToComplete : 30;
        const dueDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

        // Create enrollment record
        const enrollment = await Enrollment.create({
            employee: id,
            course: courseId,
            dueDate: dueDate,
            status: 'in-progress',
            progress: 0,
            quizCompleted: false
        });

        res.status(200).json({ success: true, message: "Enrolled successfully", enrollment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const enrolledCourses = async (req, res) => {
    try {
        const id = req.employee.id;

        // Find enrollments for the employee and populate course data
        const enrollments = await Enrollment.find({ employee: id }).populate("course");

        if (!enrollments) {
            return res.status(404).json({ success: false, message: "No enrollments found" });
        }

        // Transform enrollments to match the expected format
        const courses = enrollments.map(enrollment => ({
            _id: enrollment._id,
            course: enrollment.course,
            progress: enrollment.progress || 0,
            status: enrollment.status || 'in-progress',
            completedLessons: enrollment.completedLessons || 0,
            totalLessons: enrollment.totalLessons || 0,
            dueDate: enrollment.dueDate,
            quizCompleted: enrollment.quizCompleted || false,
            lessonProgress: enrollment.lessonProgress || []
        }));

        res.status(200).json({
            success: true,
            courses: courses
        });
    } catch (err) {
        console.error("Error fetching enrolled courses:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const checkEnrollment = async (req, res) => {
    try {
        const { employeeId, courseId } = req.params;

        // Check if enrollment exists
        const enrollment = await Enrollment.findOne({ employee: employeeId, course: courseId });

        res.status(200).json({ success: true, enrolled: !!enrollment });
    } catch (err) {
        console.error("Error checking enrollment:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * Calculate overall course progress based on lesson progress
 */
const calculateCourseProgress = async (enrolledCourse, courseId) => {
    try {
        // Get the course to count total lessons
        const course = await Course.findById(courseId);
        if (!course) return;

        // Count total lessons in the course
        let totalLessons = 0;
        course.chapters.forEach(chapter => {
            totalLessons += chapter.lessons.length;
        });

        // Count completed lessons (progress >= 90%)
        const completedLessons = enrolledCourse.lessonProgress.filter(lp => lp.progress >= 90).length;

        // Calculate overall progress percentage
        const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        // Update enrolled course data
        enrolledCourse.progress = progress;
        enrolledCourse.completedLessons = completedLessons;
        enrolledCourse.totalLessons = totalLessons;

        // Mark course as completed if all lessons are done
        if (progress >= 100) {
            enrolledCourse.status = 'completed';
        }

        return { progress, completedLessons, totalLessons };
    } catch (error) {
        console.error("Error calculating course progress:", error);
        return null;
    }
};

/**
 * Update lesson progress for an employee
 */
export const updateLessonProgress = async (req, res) => {
    try {
        const { employeeId, courseId, chapterIndex, lessonIndex, progress } = req.body;

        if (!employeeId || !courseId || chapterIndex === undefined || lessonIndex === undefined || progress === undefined) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // Find enrollment record
        const enrollment = await Enrollment.findOne({ employee: employeeId, course: courseId });
        if (!enrollment) {
            return res.status(404).json({ success: false, message: "Employee not enrolled in this course" });
        }

        // Find or create lesson progress entry
        let lessonProgress = enrollment.lessonProgress.find(
            lp => lp.chapterIndex === chapterIndex && lp.lessonIndex === lessonIndex
        );

        if (!lessonProgress) {
            lessonProgress = {
                chapterIndex,
                lessonIndex,
                progress: 0,
                completed: false,
                lastAccessed: new Date()
            };
            enrollment.lessonProgress.push(lessonProgress);
        }

        // Check if this is a PDF lesson (requires 100% completion)
        const course = await Course.findById(courseId);
        const isPDFLesson = course?.chapters?.[chapterIndex]?.lessons?.[lessonIndex]?.video
            ?.toLowerCase()
            .endsWith('.pdf');

        // Update progress and last accessed time
        lessonProgress.progress = Math.min(100, Math.max(0, progress));
        lessonProgress.completed = isPDFLesson ? lessonProgress.progress >= 100 : lessonProgress.progress >= 90;
        lessonProgress.lastAccessed = new Date();

        // Calculate and update overall course progress
        const courseProgressData = await calculateCourseProgress(enrollment, courseId);

        await enrollment.save();

        res.status(200).json({
            success: true,
            message: "Lesson progress updated",
            lessonProgress: lessonProgress,
            courseProgress: courseProgressData
        });
    } catch (err) {
        console.error("Error updating lesson progress:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * Get quiz for a course
 */
export const getCourseQuiz = async (req, res) => {
    try {
        const { courseId } = req.params;
        const employeeId = req.employee.id;

        // Check if employee is enrolled in the course
        const enrollment = await Enrollment.findOne({ employee: employeeId, course: courseId });

        if (!enrollment) {
            return res.status(403).json({ success: false, message: "Not enrolled in this course" });
        }

        // Use enrollment data
        const enrollmentData = enrollment;

        // Get the course and its quiz
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }

        if (!course.quiz || !course.quiz.published) {
            return res.status(404).json({ success: false, message: "No quiz found for this course" });
        }

        // Check if quiz has questions
        const questions = course.quiz.questions || [];
        if (questions.length === 0) {
            return res.status(404).json({ success: false, message: "Quiz has no questions" });
        }

        // Check attempt limits
        const maxAttempts = course.quiz.maxAttempts || 1;
        const attemptsUsed = enrollmentData.quizAttempts.length;
        if (attemptsUsed >= maxAttempts) {
            const lastAttempt = enrollmentData.quizAttempts[enrollmentData.quizAttempts.length - 1];
            return res.status(403).json({
                success: false,
                message: `You have reached the maximum number of attempts (${maxAttempts}) for this quiz.`,
                attemptsUsed,
                maxAttempts,
                passed: lastAttempt?.passed || false,
                score: lastAttempt?.score || 0
            });
        }

        // If already passed, don't allow retaking
        const hasPassed = enrollmentData.quizAttempts.some(attempt => attempt.passed);
        if (hasPassed) {
            const lastAttempt = enrollmentData.quizAttempts[enrollmentData.quizAttempts.length - 1];
            return res.status(403).json({
                success: false,
                message: "You have already passed this quiz.",
                passed: true,
                score: lastAttempt?.score || 0
            });
        }

        // Return quiz data (without correct answers)
        const quizData = {
            _id: course.quiz._id,
            title: course.quiz.title,
            description: course.quiz.description,
            timeLimitMins: course.quiz.timeLimitMins || 0,
            passingScore: course.quiz.passingScore || 0,
            maxAttempts: maxAttempts,
            attemptsUsed: enrollmentData.quizAttempts,
            questions: questions.map(q => ({
                _id: q._id,
                text: q.text,
                type: q.type,
                options: q.options
            }))
        };

        res.status(200).json({ success: true, quiz: quizData });
    } catch (err) {
        console.error("Error fetching quiz:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * Submit quiz answers
 */
export const submitQuiz = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { answers } = req.body; // [{ questionId, selectedOptions }]
    const employeeId = req.employee.id;

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: "Answers must be an array"
      });
    }

    // 1️⃣ Check enrollment
    const enrollment = await Enrollment.findOne({
      employee: employeeId,
      course: courseId
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "Not enrolled in this course"
      });
    }

    // 3️⃣ Fetch course & quiz
    const course = await Course.findById(courseId);
    if (!course || !course.quiz || !Array.isArray(course.quiz.questions)) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found"
      });
    }

    // 4️⃣ Calculate score
    let correctCount = 0;
    const totalQuestions = course.quiz.questions.length;

    const detailedResults = course.quiz.questions.map(question => {
      const userAnswer = answers.find(
        a => a.questionId === question._id.toString()
      );

      const selectedOptions = userAnswer?.selectedOptions || [];

      const isCorrect =
        JSON.stringify([...selectedOptions].sort()) ===
        JSON.stringify([...question.correctAnswers].sort());

      if (isCorrect) correctCount++;

      return {
        questionId: question._id,
        questionText: question.text,
        selectedOptions,
        correctOptions: question.correctAnswers,
        isCorrect
      };
    });

    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= (course.quiz.passingScore || 0);

    // 5️⃣ SAFETY CHECK (CRITICAL FIX)
    if (!Array.isArray(enrollment.quizAttempts)) {
      enrollment.quizAttempts = [];
    }

    // 6️⃣ PUSH OBJECT (THIS FIXES YOUR ERROR)
    enrollment.quizAttempts.push({
      score,
      passed,
      submittedAt: new Date()
    });

    // 7️⃣ Update enrollment state
    enrollment.quizCompleted = true;
    enrollment.progress = 100;
    enrollment.status = "completed";
    enrollment.lastAccessed = new Date();

    await enrollment.save();

    // 9️⃣ Final response
    return res.status(200).json({
      success: true,
      result: {
        score,
        correctCount,
        totalQuestions,
        passed,
        attempts: enrollment.quizAttempts.length,
        detailedResults
      }
    });

  } catch (err) {
    console.error("Error submitting quiz:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
