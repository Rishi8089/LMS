import React, { useEffect, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../config.js";
import { AuthContext } from "../context/authContext.jsx";
import getCurrentEmployee from "../customHook/getCurrentEmployee.js";

import { ClipLoader } from "react-spinners";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CourseDetails = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState(new Set());
  const [isContentExpanded, setIsContentExpanded] = useState(false);

  const { isLoggedIn } = useContext(AuthContext);
  const employee = getCurrentEmployee(isLoggedIn);
  const navigate = useNavigate();

  const formatDuration = (hours) => {
    if (hours == null) return "Duration not available";
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      const roundedHours = Math.round(hours);
      return `${roundedHours} hour${roundedHours !== 1 ? 's' : ''}`;
    }
  };

  const formatLessonDuration = (durationStr) => {
    if (!durationStr) return "";
    const parts = durationStr.split(":").map(Number);
    let totalSeconds = 0;
    if (parts.length === 3) totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    else if (parts.length === 2) totalSeconds = parts[0] * 60 + parts[1];
    else if (parts.length === 1) totalSeconds = parts[0];

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await axios.get(`${serverUrl}/api/courses/${id}`, {
          withCredentials: true,
        });
        if (response.data.success) {
          setCourse(response.data.course);
        }
      } catch (error) {
        console.error("Error fetching course details:", error);
      } finally {
        setLoading(false);
      }
    };

    const checkEnrollment = async () => {
      if (!employee || !id) return;
      try {
        const response = await axios.get(
          `${serverUrl}/api/employee/check-enrollment/${employee._id}/${id}`,
          { withCredentials: true }
        );
        if (response.data.success) {
          setIsEnrolled(response.data.enrolled);
        }
      } catch (error) {
        console.error("Error checking enrollment:", error);
      }
    };

    fetchCourse();
    if (isLoggedIn && employee) {
      checkEnrollment();
    }
  }, [id, isLoggedIn, employee]);

  const handleEnroll = async () => {
    if (!isLoggedIn) {
      toast.info("Please log in to enroll in this course");
      return;
    }

    if (!employee || !id) return;

    setEnrolling(true);

    try {
      const checkResponse = await axios.get(
        `${serverUrl}/api/employee/check-enrollment/${employee._id}/${id}`,
        { withCredentials: true }
      );

      if (checkResponse.data.success && checkResponse.data.enrolled) {
        setIsEnrolled(true);
        toast.info("You are already enrolled in this course");
        setEnrolling(false);
        return;
      }

      const response = await axios.post(
        `${serverUrl}/api/employee/enroll-course/${employee._id}`,
        { courseId: id },
        { withCredentials: true }
      );

      if (response.data.success) {
        setIsEnrolled(true);
        toast.success("Successfully enrolled in the course 🎉");
      }
    } catch (error) {
      console.error("Enrollment failed:", error);

      if (
        error.response &&
        error.response.status === 400 &&
        error.response.data.message === "Already enrolled in this course"
      ) {
        setIsEnrolled(true);
        toast.info("You are already enrolled in this course");
      } else {
        toast.error("Enrollment failed. Please try again");
      }
    } finally {
      setEnrolling(false);
    }
  };

  const toggleChapter = (chapterIndex) => {
    const newExpanded = new Set(expandedChapters);
    newExpanded.has(chapterIndex)
      ? newExpanded.delete(chapterIndex)
      : newExpanded.add(chapterIndex);
    setExpandedChapters(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500 font-semibold">
        Loading course details...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500 font-semibold">
        Course not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-7xl px-4 md:px-10 py-10 justify-center mx-auto">
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <img
          src={
            course.images && course.images.startsWith("/uploads")
              ? `${serverUrl}${course.images}`
              : course.images
          }
          alt={course.title}
          className="w-full ml-15 h-[420px] md:h-[520px] lg:h-[400px] object-fill rounded-2xl shadow-md"
        />

        <div className="ml-15 flex flex-col justify-between">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
              {course.title}
            </h2>
            <p className="text-gray-600 mb-1 text-lg capitalize">
              {course.difficulty} level
            </p>
            <p className="text-gray-500 mb-4">{formatDuration(course.hours)}</p>
            <p className="text-gray-700 leading-relaxed mb-6 text-justify">
              {course.description}
            </p>
          </div>

          {isLoggedIn ? (
            isEnrolled ? (
              <button
                onClick={() => navigate(`/player/${id}`)}
                className="bg-black text-white w-100 px-8 py-3 rounded-lg font-semibold hover:cursor-pointer transition duration-200 shadow"
              >
                Play Course
              </button>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="bg-black text-white w-100 px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 hover:cursor-pointer transition duration-200 disabled:opacity-50 flex justify-center items-center"
              >
                {enrolling ? (
                  <ClipLoader size={20} color="#ffffff" />
                ) : (
                  "Enroll Now"
                )}
              </button>
            )
          ) : (
            <p className="text-gray-500 mt-4">
              Please log in to enroll in this course.
            </p>
          )}
        </div>
      </div>

      <div className="my-10 border-t border-black"></div>

      <div className="w-full md:w-3/4 mx-auto">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">
          Course Content
        </h3>

        <div className="bg-gray-50 rounded-xl shadow-sm divide-y">
          {course.chapters?.map((chapter, chapterIndex) => (
            <div key={chapterIndex} className="p-4">
              <button
                onClick={() => toggleChapter(chapterIndex)}
                className="w-full flex justify-between items-center text-left hover:bg-gray-100 p-3 rounded-lg transition"
              >
                <h4 className="font-medium text-gray-800">
                  Chapter {chapterIndex + 1}: {chapter.title}
                </h4>
                <span className="text-gray-600">
                  {expandedChapters.has(chapterIndex) ? '-' : '+'}
                </span>
              </button>
              {expandedChapters.has(chapterIndex) && (
                <div className="mt-2 ml-6 space-y-2">
                  {chapter.lessons?.map((lesson, lessonIndex) => (
                    <div key={lessonIndex} className="text-gray-600 text-sm flex justify-between">
                      <span>{lesson.title}</span>
                      <span>{formatLessonDuration(lesson.duration)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
