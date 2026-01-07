import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import MyLearningCourseCard from "../components/MyLearningCourseCard.jsx";
import SearchBar from "../components/SearchBar.jsx";
import getCurrentEmployee from "../customHook/getCurrentEmployee.js";
import { serverUrl } from "../config.js";
import { useAuth } from "../context/authContext.jsx";

const MyLearning = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [mandatoryFilter, setMandatoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isLoggedIn } = useAuth();
  // eslint-disable-next-line no-unused-vars
  const employee = getCurrentEmployee(isLoggedIn);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const fetchEnrolledCourses = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${serverUrl}/api/employee/enrolled-courses`,
          { withCredentials: true }
        );
        if (isMounted) {
          if (response.data.success) {
            console.log("Fetched Courses:", response.data.courses); // Debug log
            setCourses(response.data.courses);
          } else {
            setCourses([]);
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error("Failed to fetch enrolled courses:", error);
          setCourses([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (isLoggedIn) {
      fetchEnrolledCourses();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn]);

  // --- SAFE FILTERING LOGIC ---
  let filteredCourses = courses.filter((enrollment) => {
    // 1. Safety Check: If enrollment or the populated course is missing, skip it
    if (!enrollment || !enrollment.course) return false;

    const course = enrollment.course;

    // 2. Safe Title Match (Prevents crash if title is undefined)
    const courseTitle = course.title ? course.title.toLowerCase() : "";
    const matchesName = courseTitle.includes(searchTerm.toLowerCase());

    // 3. Mandatory Filter
    const matchesMandatory =
      mandatoryFilter === "all"
        ? true
        : mandatoryFilter === "true"
        ? course.mandatory === true
        : course.mandatory !== true;

    // 4. Safe Difficulty Match (Prevents crash if difficulty is undefined)
    const matchesDifficulty =
      difficultyFilter === "all"
        ? true
        : course.difficulty?.toLowerCase() === difficultyFilter.toLowerCase();

    return matchesName && matchesMandatory && matchesDifficulty;
  });

  // --- SORTING LOGIC (Unchanged behavior, just safe access) ---
  filteredCourses.sort((a, b) => {
    const now = new Date();
    // Safety check in case dueDate is missing
    const dateA = a.dueDate ? new Date(a.dueDate) : null;
    const dateB = b.dueDate ? new Date(b.dueDate) : null;

    const overdueA = dateA && dateA < now;
    const overdueB = dateB && dateB < now;

    // Overdue courses go to the bottom
    if (overdueA && !overdueB) {
      return 1;
    } else if (!overdueA && overdueB) {
      return -1;
    } else if (dateA && dateB) {
      return dateA - dateB;
    } else if (dateA && !dateB) {
      return -1; // a comes first
    } else if (!dateA && dateB) {
      return 1; // b comes first
    } else {
      return 0;
    }
  });

  if (loading) {
    return (
      <div className="mt-15 px-5 sm:px-10 mb-10 h-full min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-500 font-semibold">
          Loading courses...
        </div>
      </div>
    );
  }

  return (
    <div className="mt-15 px-5 sm:px-10 mb-10 h-full min-h-screen">
      {/* Search and Filters */}
      <SearchBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        mandatoryFilter={mandatoryFilter}
        setMandatoryFilter={setMandatoryFilter}
        difficultyFilter={difficultyFilter}
        setDifficultyFilter={setDifficultyFilter}
      />

      {/* Course list */}
      <div className="flex flex-col items-center gap-6 w-full mt-6">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((enrollment) => (
            <MyLearningCourseCard
              key={enrollment._id}
              // Added safety checks (|| "") to props to ensure UI renders even with partial data
              image={enrollment.course.images} 
              title={enrollment.course.title || "Untitled Course"}
              difficulty={enrollment.course.difficulty || "N/A"}
              hours={enrollment.course.hours}
              description={enrollment.course.description}
              progress={enrollment.progress}
              mandatory={enrollment.course.mandatory}
              dueDate={enrollment.dueDate}
              status={enrollment.status}
              completedLessons={enrollment.completedLessons}
              totalLessons={enrollment.totalLessons}
              onClick={() => navigate("/course/" + enrollment.course._id)}
            />
          ))
        ) : (
          <div className="text-center text-gray-500 font-semibold mt-10">
            No courses found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default MyLearning;