import React, { useState, useEffect } from "react";
import axios from "axios"; // ✅ Import axios
import MyLearningCourseCard from "../components/MyLearningCourseCard.jsx";
import SearchBar from "../components/SearchBar.jsx";
import getCurrentEmployee from "../customHook/getCurrentEmployee.js";
const MyLearning = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [mandatoryFilter, setMandatoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [courses, setCourses] = useState([]); // ✅ renamed to courses
  const employee = getCurrentEmployee();

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/api/employee/enrolled-courses",
          { withCredentials: true }
        );
        if (response.data.success) {
          setCourses(response.data.courses);
        } else {
          setCourses([]);
        }
      } catch (error) {
        console.error("Failed to fetch enrolled courses:", error);
        setCourses([]);
      }
    };

    fetchEnrolledCourses();
  }, []);

  // Filtering logic
  const filteredCourses = courses.filter((course) => {
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
          filteredCourses.map((course) => (
            <MyLearningCourseCard
              key={course._id}
              image={course.images}
              title={course.title}
              difficulty={course.difficulty}
              hours={course.hours}
              description={course.description}
              progress={course.progress}
              mandatory={course.mandatory}
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
