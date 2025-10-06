import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../config.js";
import { AuthContext } from "../context/authContext.jsx";
import getCurrentEmployee from "../customHook/getCurrentEmployee.js";

const CourseDetails = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const { isLoggedIn } = useContext(AuthContext);
  const employee = getCurrentEmployee(isLoggedIn);

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
    setLoading(false);
  }, [id, isLoggedIn, employee]);

  const handleEnroll = async () => {
    if (!employee || !id) return;
    setEnrolling(true);
    try {
      const response = await axios.post(
        `${serverUrl}/api/employee/enroll-course/${employee._id}`,
        { courseId: id },
        { withCredentials: true }
      );
      if (response.data.success) {
        setIsEnrolled(true);
      }
    } catch (error) {
      console.error("Enrollment failed:", error);
    } finally {
      setEnrolling(false);
    }
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
    <div className="min-h-screen">
      {/* Main Course Section */}
      <div className="w-full mx-auto mt-0 p-6 ">
        <div className="grid md:grid-cols-2 gap-8">
          <img
            src={course.images}
            alt={course.title}
            className="w-full h-100 object-cover rounded-lg"
          />

          <div className="flex flex-col ">
            <h2 className="text-4xl font-bold text-gray-800 mb-2 ">
              {course.title} -{" "}
              <span className="font-medium text-gray-600">
                {course.difficulty} level
              </span>
            </h2>

            <p className="text-gray-500 mb-2">{course.hours} hrs</p>
            <p className="text-gray-700 leading-relaxed mb-4">
              {course.description}
            </p>

            <p className="text-red-500 font-semibold mb-4">Pending</p>

            {isLoggedIn ? (
              isEnrolled ? (
                <button className="bg-black text-white px-6 py-2 rounded-md w-32 hover:bg-gray-800 transition">
                  Play
                </button>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="bg-black text-white px-6 py-2 rounded-md w-32 hover:bg-gray-700 transition disabled:opacity-50 cursor-pointer"
                >
                  {enrolling ? "Enrolling..." : "Enroll Now"}
                </button>
              )
            ) : (
              <p className="text-gray-500">Please log in to enroll in this course.</p>
            )}
          </div>
        </div>

        {/* Course Content Section
        <div className="mt-10 border rounded-lg">
          <div className="border-b p-4 bg-gray-50">
            <h3 className="font-semibold text-lg">Course Content</h3>
            <p className="text-sm text-gray-500">
              {course.lessons?.length || 0} lectures •{" "}
              {course.totalDuration || "0m"}
            </p>
          </div>

          <div className="divide-y">
            {course.lessons?.map((lesson, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-4 hover:bg-gray-100"
              >
                <p className="text-gray-700">
                  Tutorial {index + 1} - {lesson.title}
                </p>
                <p className="text-gray-500 text-sm">{lesson.duration}</p>
              </div>
            ))}
          </div>
        </div> */}
      </div>

      {/* Footer */}
    </div>
  );
};

export default CourseDetails;
