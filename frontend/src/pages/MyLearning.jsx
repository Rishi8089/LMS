import React, { useState, useEffect } from "react";
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
  const employee = getCurrentEmployee(isLoggedIn);

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

    fetchEnrolledCourses();

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn]);

  // Filtering logic
  const filteredCourses = courses.filter((enrollment) => {
    if (!enrollment.course) return false;
    const course = enrollment.course;
    const matchesName = course.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesMandatory =
      mandatoryFilter === "all"
        ? true
        : mandatoryFilter === "true"
        ? course.mandatory === true
        : course.mandatory !== true;

    const matchesDifficulty =
      difficultyFilter === "all"
        ? true
        : course.difficulty?.toLowerCase() === difficultyFilter.toLowerCase();

    return matchesName && matchesMandatory && matchesDifficulty;
  });

  if (loading) {
    return (
      <div className="mt-15 px-5 sm:px-10 mb-10 h-full min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-500 font-semibold">Loading courses...</div>
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
              image={enrollment.course.images}
              title={enrollment.course.title}
              difficulty={enrollment.course.difficulty}
              hours={enrollment.course.hours}
              description={enrollment.course.description}
              progress={enrollment.progress}
              mandatory={enrollment.course.mandatory}
              dueDate={enrollment.dueDate}
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
