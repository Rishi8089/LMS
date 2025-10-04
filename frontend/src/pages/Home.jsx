import React, { useState, useEffect } from "react";
import SearchBar from "../components/SearchBar.jsx";
import CourseCard from "../components/CourseCard.jsx";
import { useNavigate } from "react-router-dom";

// const courses = [
//   {
//     id: 1,
//     image: "/src/assets/course1.jpg",
//     title: "React for Beginners",
//     hours: "12",
//     description:
//       "Learn the basics of React.js and build dynamic web applications with components, hooks, and routing.",
//     difficulty: "Beginner",
//     mandatory: true,
//   },
//   {
//     id: 2,
//     image: "/src/assets/course1.jpg",
//     title: "JavaScript Essentials",
//     hours: "10",
//     description:
//       "Master the fundamentals of JavaScript, including variables, functions, and DOM manipulation.",
//     difficulty: "Intermediate",
//     mandatory: true,
//   },
//   {
//     id: 3,
//     image: "/src/assets/course1.jpg",
//     title: "Node.js Basics",
//     hours: "15",
//     description:
//       "Understand how to build backend applications with Node.js, Express, and APIs.",
//     difficulty: "Beginner",
//   },
//   {
//     id: 4,
//     image: "/src/assets/course1.jpg",
//     title: "Full-Stack Development",
//     hours: "20",
//     description:
//       "Combine frontend and backend skills to build complete applications with React and Node.js.",
//     difficulty: "Hard",
//   },
//   {
//     id: 5,
//     image: "/src/assets/course1.jpg",
//     title: "UI/UX Fundamentals",
//     hours: "8",
//     description:
//       "Learn the essentials of designing clean and user-friendly web interfaces.",
//     difficulty: "Beginner",
//     mandatory: true,
//   },
//   {
//     id: 6,
//     image: "/src/assets/course1.jpg",
//     title: "Database Management",
//     hours: "14",
//     description:
//       "Understand relational and NoSQL databases, including SQL queries and MongoDB.",
//     difficulty: "Beginner",
//   },
//   {
//     id: 7,
//     image: "/src/assets/course1.jpg",
//     title: "Advanced React",
//     hours: "18",
//     description:
//       "Deep dive into React hooks, context, performance optimization, and advanced state management.",
//     difficulty: "Hard",
//   },
//   {
//     id: 8,
//     image: "/src/assets/course1.jpg",
//     title: "DevOps Basics",
//     hours: "16",
//     description:
//       "Get started with CI/CD pipelines, Docker, Kubernetes, and cloud deployments.",
//     difficulty: "Beginner",
//   },
// ];

const Home = () => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [mandatoryFilter, setMandatoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/courses");
        const data = await response.json();
        if (data.success) {
          setCourses(data.courses);
          // console.log("Fetched Courses:", data.courses);
        } else {
          console.error("Failed to fetch courses");
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

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

      {/* Grid layout for courses */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <CourseCard key={course._id} {...course} />
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500">
            No courses found.
          </p>
        )}
      </div>

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
