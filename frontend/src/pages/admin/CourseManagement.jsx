import React, { useState, useEffect } from "react";
import axios from "axios";
import { serverUrl } from "../../config.js";
import { toast } from "react-toastify";
import {
  FiPlus,
  FiEdit,
  FiTrash,
  FiX,
  FiFolder,
  FiCheckSquare,
  FiClock,
  FiLayers,
  FiCalendar,
  FiImage,
  FiFileText,
  FiEye, // Imported Eye icon
  FiUser, // Imported User icon
} from "react-icons/fi";
import { Loader2 } from "lucide-react";
import useFolderProcessor from "../../customHook/useFolderProcessor.js";

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [quizForm, setQuizForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  // --- NEW STATE FOR QUIZ ATTEMPTS MODAL ---
  const [showAttemptsModal, setShowAttemptsModal] = useState(false);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [currentCourseAttempts, setCurrentCourseAttempts] = useState([]);
  const [selectedCourseTitle, setSelectedCourseTitle] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    hours: "",
    difficulty: "Beginner",
    mandatory: false,
    images: null,
    dueDate: "",
    chapters: [
      { title: "", lessons: [{ title: "", video: null, duration: "" }] },
    ],
    quiz: {
      title: "",
      description: "",
      timeLimitMins: 0,
      maxAttempts: 1,
      shuffleQuestions: false,
      shuffleOptions: false,
      passingScore: 0,
      published: false,
      questions: [
        {
          text: "",
          type: "mcq_single",
          options: ["", ""],
          correctAnswers: [],
          marks: 1,
          explanation: "",
        },
      ],
    },
  });

  const {
    courseData,
    isLoading: folderLoading,
    error: folderError,
    handleFileChange,
  } = useFolderProcessor();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${serverUrl}/api/admin/courses`, {
        withCredentials: true,
      });
      setCourses(res.data.courses || []);
    } catch (error) {
      console.error("fetchCourses error:", error?.response?.data || error);
      toast.error("Failed to load courses.");
    } finally {
      setLoading(false);
    }
  };

  // --- NEW FUNCTION TO HANDLE VIEWING ATTEMPTS ---
  const handleViewAttempts = async (courseId, courseTitle) => {
    setSelectedCourseTitle(courseTitle);
    setShowAttemptsModal(true);
    setAttemptsLoading(true);
    setCurrentCourseAttempts([]); // Reset previous data

    try {
      // NOTE: Ensure this endpoint exists in your backend
      const res = await axios.get(`${serverUrl}/api/admin/quiz-attempts/${courseId}`, {
        withCredentials: true,
      });

      // Transform nested backend data to flat attempts array
      const quizAttempts = res.data.quizAttempts || [];
      const flatAttempts = [];
      quizAttempts.forEach(employeeData => {
        employeeData.attempts.forEach(attempt => {
          flatAttempts.push({
            employeeName: employeeData.employee.name,
            employeeEmail: employeeData.employee.email,
            score: attempt.score,
            passed: attempt.passed,
            date: attempt.submittedAt
          });
        });
      });

      setCurrentCourseAttempts(flatAttempts);
    } catch (error) {
      console.error("fetchAttempts error:", error);
      // toast.error("Failed to load attempts.");
    } finally {
      setAttemptsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const normalizeDifficulty = (val) => {
    if (!val && val !== "") return "Beginner";
    const map = {
      Beginner: "Beginner",
      "Beginner 🟢": "Beginner",
      Intermediate: "Intermediate",
      "Intermediate 🟡": "Intermediate",
      Hard: "Hard",
      "Hard 🔴": "Hard",
    };
    if (map[val]) return map[val];
    const cleaned = String(val).replace(/[^\w\s]/g, "").trim().split(" ")[0];
    return cleaned || "Beginner";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.warn("Please fill all required fields correctly.");
      return;
    }

    // Filter out invalid quiz questions
    const validQuestions = formData.quiz.questions.filter(
      (q) =>
        q.text.trim() &&
        q.options.length >= 2 &&
        q.options.every((o) => o.trim()) &&
        q.correctAnswers.length > 0
    );
    formData.quiz.questions = validQuestions;

    // Set quiz as published if it has valid questions
    if (validQuestions.length > 0) {
      formData.quiz.published = true;
    }

    // Filter out invalid chapters and lessons
    const validChapters = formData.chapters
      .filter(
        (chapter) =>
          chapter.title.trim() &&
          chapter.lessons.some(
            (lesson) =>
              lesson.title.trim() && (lesson.duration.trim() || lesson.video)
          )
      )
      .map((chapter) => ({
        ...chapter,
        lessons: chapter.lessons.filter(
          (lesson) =>
            lesson.title.trim() && (lesson.duration.trim() || lesson.video)
        ),
      }));
    formData.chapters = validChapters;

    const formDataToSend = new FormData();
    formDataToSend.append("title", formData.title);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("hours", Number(formData.hours));
    formDataToSend.append(
      "difficulty",
      normalizeDifficulty(formData.difficulty)
    );
    formDataToSend.append("mandatory", formData.mandatory ? "true" : "false");
    formDataToSend.append("dueDate", formData.dueDate || "");

    if (formData.images instanceof File) {
      formDataToSend.append("images", formData.images);
    }

    const videoFiles = [];
    const processedChapters = formData.chapters.map((chapter) => ({
      ...chapter,
      lessons: chapter.lessons.map((lesson) => {
        if (lesson.video instanceof File) {
          videoFiles.push(lesson.video);
          return { ...lesson, video: true };
        }
        return { ...lesson, video: lesson.video || "" };
      }),
    }));

    formDataToSend.append("chapters", JSON.stringify(processedChapters));
    videoFiles.forEach((file) => formDataToSend.append("files", file));
    formDataToSend.append("quiz", JSON.stringify(formData.quiz));

    try {
      if (editingCourse) {
        await axios.put(
          `${serverUrl}/api/admin/courses/${editingCourse._id}`,
          formDataToSend,
          {
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 300000,
          }
        );
        toast.success("Course updated successfully!");
      } else {
        await axios.post(`${serverUrl}/api/admin/courses`, formDataToSend, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 300000,
        });
        toast.success("Course created successfully!");
      }
      resetForm();
      fetchCourses();
    } catch (error) {
      console.error(
        "Create/Update Course Error:",
        error?.response?.data || error
      );
      const backendMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to save course.";
      toast.error(backendMsg);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      hours: "",
      difficulty: "Beginner",
      mandatory: false,
      images: null,
      dueDate: "",
      chapters: [
        { title: "", lessons: [{ title: "", video: null, duration: "" }] },
      ],
      quiz: {
        title: "",
        description: "",
        timeLimitMins: 0,
        maxAttempts: 1,
        shuffleQuestions: false,
        shuffleOptions: false,
        passingScore: 0,
        published: false,
        questions: [
          {
            text: "",
            type: "mcq_single",
            options: ["", ""],
            correctAnswers: [],
            marks: 1,
            explanation: "",
          },
        ],
      },
    });
    setEditingCourse(null);
    setShowForm(false);
    setQuizForm(false);
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title || "",
      description: course.description || "",
      hours: course.hours?.toString() ?? "",
      difficulty: course.difficulty || "Beginner",
      mandatory: !!course.mandatory,
      images: null,
      dueDate: course.dueDate ? course.dueDate.split("T")[0] : "",
      chapters: course.chapters?.length
        ? course.chapters
        : [{ title: "", lessons: [{ title: "", video: null, duration: "" }] }],
      quiz: course.quiz || {
        title: "",
        description: "",
        timeLimitMins: 0,
        maxAttempts: 1,
        shuffleQuestions: false,
        shuffleOptions: false,
        passingScore: 0,
        published: false,
        questions: [
          {
            text: "",
            type: "mcq_single",
            options: ["", ""],
            correctAnswers: [],
            marks: 1,
            explanation: "",
          },
        ],
      },
    });
    setShowForm(true);
  };

  const handleDelete = async (course) => {
    if (!window.confirm(`Delete course "${course.title}"?`)) return;
    try {
      await axios.delete(`${serverUrl}/api/admin/courses/${course._id}`, {
        withCredentials: true,
      });
      toast.success("Course deleted!");
      fetchCourses();
    } catch (error) {
      console.error("handleDelete error:", error?.response?.data || error);
      toast.error("Failed to delete course.");
    }
  };

  const importFromFolder = () => {
    if (courseData?.title && courseData.chapters?.length > 0) {
      const importedChapters = courseData.chapters.map((chapter) => ({
        title: chapter.name,
        lessons: chapter.lessons.map((lesson) => ({
          title: lesson.name,
          video: lesson.file || null,
          duration: "",
        })),
      }));

      setFormData((prev) => ({
        ...prev,
        title: courseData.title,
        chapters: importedChapters,
      }));

      toast.success("Course structure imported from folder!");
    } else {
      toast.warn("No course structure found. Please select a valid folder.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-600 font-medium">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-orange-500" />
        Loading dashboard...
      </div>
    );
  }

  // --- Styles ---
  const labelClass =
    "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2";
  const inputClass =
    "w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all duration-200 placeholder-gray-400";
  const cardClass =
    "bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden";
  const btnBlack =
    "inline-flex items-center gap-2 bg-black hover:bg-gray-800 text-white text-sm font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md";
  const btnSecondary =
    "inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold py-3 px-6 rounded-lg transition-colors duration-200";

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 sm:p-10 font-sans relative">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            Course Management
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Create, edit and manage your educational content.
          </p>
          <div className="mt-3 h-1 w-28 rounded-full bg-gradient-to-r from-orange-400 to-orange-600" />
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-black text-white px-7 py-4 rounded-xl text-sm font-semibold hover:bg-gray-800 transition"
          >
            + Create Course
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {showForm ? (
        <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
          {!quizForm ? (
            <>
              {/* Wrapped in a fragment to fix adjacent element syntax error */}
              <button
                onClick={() => setQuizForm(true)}
                className="bg-black text-white px-7 py-4 rounded-xl text-sm font-semibold ml-auto mb-6 block hover:bg-gray-800 transition"
              >
                + Add Quiz
              </button>

              <div
                className={`${cardClass} shadow-xl border-t-4 border-t-orange-500`}
              >
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    {editingCourse ? (
                      <FiEdit className="text-orange-500" />
                    ) : (
                      <FiPlus className="text-orange-500" />
                    )}
                    {editingCourse
                      ? "Edit Existing Course"
                      : "Create New Course"}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                  {/* Section 1: Basic Information */}
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className={labelClass}>Course Title</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g. Masterclass in React Design Patterns"
                        className={`${inputClass} text-lg font-medium`}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Provide a comprehensive overview of what the student will learn..."
                        rows="4"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Duration */}
                    <div className="relative">
                      <label className={labelClass}>Duration</label>
                      <div className="relative">
                        <FiClock className="absolute left-3 top-3.5 text-gray-400" />
                        <input
                          type="number"
                          name="hours"
                          min="0"
                          value={formData.hours}
                          onChange={handleChange}
                          className={`${inputClass} pl-10`}
                          placeholder="e.g. 12"
                        />
                      </div>
                    </div>

                    {/* Difficulty */}
                    <div className="relative">
                      <label className={labelClass}>Difficulty Level</label>
                      <div className="relative">
                        <FiLayers className="absolute left-3 top-3.5 text-gray-400" />
                        <select
                          name="difficulty"
                          value={formData.difficulty}
                          onChange={handleChange}
                          className={`${inputClass} pl-10 appearance-none`}
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>
                    </div>

                    {/* Due Date */}
                    <div className="relative">
                      <label htmlFor="dueDate" className={labelClass}>
                        Due Date
                      </label>
                      <div className="relative">
                        <FiCalendar className="absolute left-3 top-3.5 text-gray-400" />
                        <input
                          type="date"
                          id="dueDate"
                          name="dueDate"
                          value={formData.dueDate}
                          onChange={handleChange}
                          className={`${inputClass} pl-10`}
                        />
                      </div>
                    </div>

                    {/* Mandatory Checkbox */}
                    <div className="flex flex-col justify-end pb-3">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            name="mandatory"
                            checked={formData.mandatory}
                            onChange={handleChange}
                            className="peer sr-only"
                          />
                          <div className="w-6 h-6 border-2 border-gray-300 rounded bg-white peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-all"></div>
                          <FiCheckSquare className="w-4 h-4 text-white absolute top-1 left-1 opacity-0 peer-checked:opacity-100 transition-all" />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 group-hover:text-orange-600 transition-colors">
                          Mandatory Course
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Cover Image */}
                  <div>
                    <label className={labelClass}>Course Cover Image</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-50 hover:border-orange-300 transition-colors cursor-pointer relative">
                      <input
                        type="file"
                        name="images"
                        accept="image/*"
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            images: e.target.files[0],
                          }))
                        }
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center justify-center pointer-events-none">
                        <div className="bg-orange-50 p-3 rounded-full mb-3">
                          <FiImage className="w-6 h-6 text-orange-500" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                          {formData.images instanceof File
                            ? formData.images.name
                            : "Click to upload course thumbnail"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          SVG, PNG, JPG or GIF (max. 2MB)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-100"></div>

                  {/* Folder Import Section */}
                  <div className="bg-slate-50 border-l-4 border-orange-500 rounded-r-xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <FiFolder className="text-orange-500" />
                      Smart Import
                    </h3>
                    <p className="text-sm text-gray-500 mb-6 max-w-2xl">
                      Ensure the structure is: Course / Chapter / Lesson.mp4
                    </p>

                    {typeof document !== "undefined" &&
                      !("webkitdirectory" in document.createElement("input")) && (
                        <div className="mb-4 p-3 bg-yellow-50 text-yellow-700 text-sm rounded-lg border border-yellow-200">
                          Folder upload requires Chrome, Edge, or Firefox.
                        </div>
                      )}

                    <div className="flex flex-col sm:flex-row gap-4">
                      <input
                        type="file"
                        webkitdirectory=""
                        directory=""
                        allowdirs=""
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white file:text-orange-600 hover:file:bg-orange-50 file:border-gray-200 border border-gray-200 rounded-lg cursor-pointer bg-white"
                        disabled={folderLoading}
                      />
                      <button
                        type="button"
                        onClick={importFromFolder}
                        disabled={folderLoading || !courseData?.title}
                        className="whitespace-nowrap bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-2 shadow-sm transition-all"
                      >
                        {folderLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <FiFolder className="w-4 h-4" />
                        )}
                        {folderLoading ? "Scanning..." : "Process Structure"}
                      </button>
                    </div>

                    {folderError && (
                      <p className="mt-3 text-red-500 text-sm font-medium">
                        {folderError}
                      </p>
                    )}

                    {courseData?.title && !folderLoading && (
                      <div className="mt-4 flex items-center gap-2 text-green-600 text-sm font-medium bg-green-50 p-3 rounded-lg border border-green-100">
                        <FiCheckSquare /> Ready: {courseData.title} (
                        {courseData.chapters.length} chapters found)
                      </div>
                    )}
                  </div>

                  {/* Chapters & Lessons */}
                  <div>
                    <div className="flex justify-between items-end mb-4">
                      <h3 className="text-lg font-bold text-gray-800">
                        Curriculum
                      </h3>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                        Structure your content
                      </p>
                    </div>

                    <div className="space-y-6">
                      {formData.chapters.map((chapter, ci) => (
                        <div
                          key={ci}
                          className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                          {/* Chapter Header */}
                          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-4">
                            <span className="bg-white border border-gray-200 text-gray-500 w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold">
                              {ci + 1}
                            </span>
                            <input
                              type="text"
                              placeholder="Chapter Title"
                              value={chapter.title}
                              onChange={(e) => {
                                const chapters = [...formData.chapters];
                                chapters[ci].title = e.target.value;
                                setFormData({ ...formData, chapters });
                              }}
                              className="bg-transparent border-none text-gray-800 font-semibold focus:ring-0 p-0 w-full placeholder-gray-400 text-lg"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  chapters: formData.chapters.filter(
                                    (_, i) => i !== ci
                                  ),
                                })
                              }
                              className="text-gray-400 hover:text-red-500 transition-colors p-2"
                            >
                              <FiTrash className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Lessons List */}
                          <div className="p-6 space-y-3">
                            {chapter.lessons.map((lesson, li) => (
                              <div
                                key={li}
                                className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-white p-3 rounded-lg border border-gray-100 hover:border-orange-200 transition-colors group"
                              >
                                <div className="p-2 bg-orange-50 text-orange-500 rounded-md">
                                  <FiFileText className="w-4 h-4" />
                                </div>

                                <input
                                  type="text"
                                  placeholder="Lesson Title"
                                  value={lesson.title}
                                  onChange={(e) => {
                                    const chapters = [...formData.chapters];
                                    chapters[ci].lessons[li].title =
                                      e.target.value;
                                    setFormData({ ...formData, chapters });
                                  }}
                                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 placeholder-gray-400 p-0"
                                />

                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                  <label className="cursor-pointer bg-gray-50 hover:bg-gray-100 text-gray-500 px-3 py-1.5 rounded-md text-xs font-medium border border-gray-200 transition-colors whitespace-nowrap">
                                    {lesson.video
                                      ? lesson.video instanceof File
                                        ? lesson.video.name.substring(0, 10) +
                                          "..."
                                        : "File Uploaded"
                                      : "Upload Content"}
                                    <input
                                      type="file"
                                      accept="video/*,image/*,application/pdf"
                                      className="hidden"
                                      onChange={(e) => {
                                        const chapters = [...formData.chapters];
                                        chapters[ci].lessons[li].video =
                                          e.target.files[0];
                                        setFormData({ ...formData, chapters });
                                      }}
                                    />
                                  </label>

                                  <input
                                    type="text"
                                    placeholder="00:00"
                                    value={lesson.duration}
                                    onChange={(e) => {
                                      const chapters = [...formData.chapters];
                                      chapters[ci].lessons[li].duration =
                                        e.target.value;
                                      setFormData({ ...formData, chapters });
                                    }}
                                    className="w-16 bg-gray-50 border-none rounded-md text-xs text-center py-1.5 focus:ring-1 focus:ring-orange-500"
                                  />

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const chapters = [...formData.chapters];
                                      chapters[ci].lessons = chapters[
                                        ci
                                      ].lessons.filter((_, i) => i !== li);
                                      setFormData({ ...formData, chapters });
                                    }}
                                    className="text-gray-300 hover:text-red-500 transition-colors"
                                  >
                                    <FiX className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => {
                                const chapters = [...formData.chapters];
                                chapters[ci].lessons.push({
                                  title: "",
                                  video: null,
                                  duration: "",
                                });
                                setFormData({ ...formData, chapters });
                              }}
                              className="mt-2 text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 uppercase tracking-wide"
                            >
                              <FiPlus /> Add Lesson
                            </button>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            chapters: [
                              ...formData.chapters,
                              {
                                title: "",
                                lessons: [
                                  { title: "", video: null, duration: "" },
                                ],
                              },
                            ],
                          })
                        }
                        className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-semibold hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
                      >
                        <FiPlus className="w-5 h-5" /> Add New Chapter
                      </button>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-4 sticky bottom-0 bg-white p-4 -mx-8 -mb-8 rounded-b-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <button
                      type="button"
                      onClick={resetForm}
                      className={btnSecondary}
                    >
                      Cancel
                    </button>
                    <button type="submit" className={btnBlack}>
                      {editingCourse ? "Save Changes" : "Publish Course"}
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            /* ============================================ QUIZ FORM START =============================================== */
            <div
              className={`${cardClass} shadow-xl border-t-4 border-t-black`}
            >
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FiCheckSquare className="text-black" />
                    Quiz Configuration
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Attach a quiz to verify student understanding.
                  </p>
                </div>
                <button
                  onClick={() => setQuizForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-8">
                {/* Quiz Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <label className={labelClass}>Passing Score (%)</label>
                    <input
                      type="number"
                      name="passingScore"
                      value={formData.quiz.passingScore}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          quiz: {
                            ...formData.quiz,
                            passingScore: e.target.value,
                          },
                        })
                      }
                      className={inputClass}
                      placeholder="e.g. 70"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Time Limit (Minutes)</label>
                    <input
                      type="number"
                      name="timeLimitMins"
                      value={formData.quiz.timeLimitMins}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          quiz: {
                            ...formData.quiz,
                            timeLimitMins: e.target.value,
                          },
                        })
                      }
                      className={inputClass}
                      placeholder="0 for no limit"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Max Attempts</label>
                    <input
                      type="number"
                      name="maxAttempts"
                      value={formData.quiz.maxAttempts}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          quiz: {
                            ...formData.quiz,
                            maxAttempts: e.target.value,
                          },
                        })
                      }
                      className={inputClass}
                      placeholder="e.g. 3"
                    />
                  </div>
                </div>

                {/* Shuffle Questions and Options */}
                <div className="flex gap-6 pb-4 border-b border-gray-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-black w-4 h-4"
                      checked={formData.quiz.shuffleQuestions}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          quiz: {
                            ...formData.quiz,
                            shuffleQuestions: e.target.checked,
                          },
                        })
                      }
                    />
                    <span className="text-sm text-gray-700">
                      Shuffle Questions
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-black w-4 h-4"
                      checked={formData.quiz.shuffleOptions}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          quiz: {
                            ...formData.quiz,
                            shuffleOptions: e.target.checked,
                          },
                        })
                      }
                    />
                    <span className="text-sm text-gray-700">
                      Shuffle Options
                    </span>
                  </label>
                </div>

                {/* Questions List */}
                <div className="space-y-6">
                  {formData.quiz.questions.map((question, qIndex) => (
                    <div
                      key={qIndex}
                      className="bg-gray-50 border border-gray-200 rounded-xl p-6 relative"
                    >
                      <div className="absolute top-4 right-4">
                        <button
                          onClick={() => {
                            const newQuestions = formData.quiz.questions.filter(
                              (_, i) => i !== qIndex
                            );
                            setFormData({
                              ...formData,
                              quiz: {
                                ...formData.quiz,
                                questions: newQuestions,
                              },
                            });
                          }}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <FiTrash />
                        </button>
                      </div>

                      <div className="mb-4 pr-8">
                        <label className={labelClass}>
                          Question {qIndex + 1} Text
                        </label>
                        <input
                          type="text"
                          value={question.text}
                          onChange={(e) => {
                            const newQuestions = [...formData.quiz.questions];
                            newQuestions[qIndex].text = e.target.value;
                            setFormData({
                              ...formData,
                              quiz: {
                                ...formData.quiz,
                                questions: newQuestions,
                              },
                            });
                          }}
                          className={`${inputClass} bg-white`}
                          placeholder="Enter question here..."
                        />
                      </div>

                      {/* Options */}
                      <div className="space-y-3">
                        <label className={labelClass}>Options</label>
                        {question.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-3">
                            <input
                              type="radio"
                              name={`correct-answer-${qIndex}`}
                              checked={
                                question.correctAnswers.includes(option) &&
                                option !== ""
                              }
                              onChange={() => {
                                const newQuestions = [
                                  ...formData.quiz.questions,
                                ];
                                newQuestions[qIndex].correctAnswers = [option];
                                setFormData({
                                  ...formData,
                                  quiz: {
                                    ...formData.quiz,
                                    questions: newQuestions,
                                  },
                                });
                              }}
                              className="w-4 h-4 accent-green-600 cursor-pointer"
                              title="Mark as correct answer"
                            />
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => {
                                const newQuestions = [
                                  ...formData.quiz.questions,
                                ];
                                newQuestions[qIndex].options[oIndex] =
                                  e.target.value;
                                // Reset correct answer if the text changes to avoid mismatches
                                newQuestions[qIndex].correctAnswers = [];
                                setFormData({
                                  ...formData,
                                  quiz: {
                                    ...formData.quiz,
                                    questions: newQuestions,
                                  },
                                });
                              }}
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-orange-400"
                              placeholder={`Option ${oIndex + 1}`}
                            />
                            {question.options.length > 2 && (
                              <button
                                onClick={() => {
                                  const newQuestions = [
                                    ...formData.quiz.questions,
                                  ];
                                  newQuestions[qIndex].options = newQuestions[
                                    qIndex
                                  ].options.filter((_, i) => i !== oIndex);
                                  setFormData({
                                    ...formData,
                                    quiz: {
                                      ...formData.quiz,
                                      questions: newQuestions,
                                    },
                                  });
                                }}
                                className="text-red-400 hover:text-red-600"
                              >
                                <FiX />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const newQuestions = [...formData.quiz.questions];
                            newQuestions[qIndex].options.push("");
                            setFormData({
                              ...formData,
                              quiz: {
                                ...formData.quiz,
                                questions: newQuestions,
                              },
                            });
                          }}
                          className="text-xs font-bold text-orange-600 hover:text-orange-700 uppercase tracking-wide flex items-center gap-1"
                        >
                          <FiPlus /> Add Option
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      quiz: {
                        ...formData.quiz,
                        questions: [
                          ...formData.quiz.questions,
                          {
                            text: "",
                            type: "mcq_single",
                            options: ["", ""],
                            correctAnswers: [],
                            marks: 1,
                            explanation: "",
                          },
                        ],
                      },
                    })
                  }
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-semibold hover:border-black hover:text-black hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                  <FiPlus className="w-5 h-5" /> Add Question
                </button>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-gray-100 flex justify-end gap-4">
                  <button
                    onClick={() => setQuizForm(false)}
                    className={btnBlack}
                  >
                    Done & Return to Course
                  </button>
                </div>
              </div>
            </div>
            /* =========================================== QUIZ FORM END ================================================= */
          )}
        </div>
      ) : (
        /*========================================  Course List Table ===================================================*/
        <div className="bg-white border border-orange-100 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-orange-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Title
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    Difficulty
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    Mandatory
                  </th>
                  {/* --- NEW COLUMN HEADER --- */}
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    Quiz Reports
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {courses.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-10 text-center text-gray-500 text-sm"
                    >
                      No courses found. Click “Create Course” to create one.
                    </td>
                  </tr>
                ) : (
                  courses.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-black">
                        {c.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">
                        {c.hours ? `${Math.round(c.hours * 60)} Minutes` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium
                          ${
                            c.difficulty === "Beginner"
                              ? "bg-green-100 text-green-700"
                              : c.difficulty === "Intermediate"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {c.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-gray-600">
                        {c.mandatory ? "Yes" : "No"}
                      </td>

                      {/* --- NEW COLUMN CELL: QUIZ ATTEMPTS BUTTON --- */}
                      <td className="px-6 py-4 text-sm text-center">
                        <button
                          onClick={() => handleViewAttempts(c._id, c.title)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700 rounded-md text-xs font-bold transition-colors border border-orange-200"
                        >
                          <FiEye className="w-3 h-3" /> View List
                        </button>
                      </td>

                      <td className="px-6 py-4 text-sm text-center">
                        <div className="flex justify-center gap-4">
                          <button
                            onClick={() => handleEdit(c)}
                            className="text-blue-600 hover:underline font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(c)}
                            className="text-red-600 hover:underline font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- NEW MODAL FOR DISPLAYING QUIZ ATTEMPTS --- */}
      {showAttemptsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Quiz Attempts
                </h3>
                <p className="text-sm text-gray-500">
                  Course: {selectedCourseTitle}
                </p>
              </div>
              <button
                onClick={() => setShowAttemptsModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {attemptsLoading ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-2" />
                  <p>Fetching attempts...</p>
                </div>
              ) : currentCourseAttempts.length === 0 ? (
                <div className="text-center py-10 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
                  <FiUser className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No attempts recorded for this course yet.</p>
                </div>
              ) : (
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          Employee Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          Email
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                          Quiz Marks
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {currentCourseAttempts.map((attempt, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {attempt.employeeName || "Unknown Employee"}
                          </td>
                          <td className="px-4 py-3 text-sm text-left text-gray-700">
                            {attempt.employeeEmail || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-700">
                            {attempt.score}%
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold ${
                                attempt.passed
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {attempt.passed ? "PASSED" : "FAILED"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-500">
                            {attempt.date
                              ? new Date(attempt.date).toLocaleDateString()
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowAttemptsModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;