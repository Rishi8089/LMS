import React, { useState, useEffect } from "react";
import SearchBar from "../components/SearchBar.jsx";
import CourseCard from "../components/CourseCard.jsx";
import { useNavigate } from "react-router-dom";
import { serverUrl } from "../config.js";


const Home = () => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [mandatoryFilter, setMandatoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${serverUrl}/api/courses`);
      const data = await response.json();
      if (data.success) {
        setCourses(data.courses);
        // console.log("Fetched Courses:", data.courses);
      } else {
        console.error("Failed to fetch courses");
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
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
        : course.difficulty.toLowerCase() === difficultyFilter.toLowerCase();

    return matchesName && matchesMandatory && matchesDifficulty;
  });

  return (
    <div className="mt-15 px-5 sm:px-10 mb-10">
      {/* <h2 className="relative flex flex-center text-3xl font-bold text-gray-800">Login here ..</h2>
        <br /> */}
      {/* Search and Filters */}
      <SearchBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        mandatoryFilter={mandatoryFilter}
        setMandatoryFilter={setMandatoryFilter}
        difficultyFilter={difficultyFilter}
        setDifficultyFilter={setDifficultyFilter}
      />
      {loading ? (
        <div className="text-center text-gray-500 font-semibold mt-10">Loading courses...</div>
      ) : (
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course) => (
              <CourseCard key={course._id} {...course} onEnroll={fetchCourses} />
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500">
              No courses found.
            </p>
          )}
        </div>
      )}

      {/* Explore More button */}
      <div className="flex justify-center mt-10">
        <button
          onClick={() => navigate("/")}
          className="w-50 cursor-pointer flex items-center justify-center bg-black text-white px-8 py-3 rounded-full shadow transition-transform ease-in-out hover:scale-95"
        >
          Explore More
        </button>
      </div>
    </div>
  );
};

export default Home;
