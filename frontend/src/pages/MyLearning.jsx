import React, { useState } from "react";
import MyLearningCourseCard from "../components/MyLearningCourseCard.jsx";
import SearchBar from "../components/SearchBar.jsx";

const MyLearning = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [mandatoryFilter, setMandatoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  const courses = [
    
    {
    id: 2,
    image: "/src/assets/course1.jpg",
    title: "JavaScript Essentials",
    hours: "10",
    description:
      "Master the fundamentals of JavaScript, including variables, functions, and DOM manipulation.",
    difficulty: "Intermediate",
    progress:" 70",
    mandatory: true,
  },
  {
    id: 3,
    image: "/src/assets/course1.jpg",
    title: "Node.js Basics",
    hours: "15",
    description:
      "Understand how to build backend applications with Node.js, Express, and APIs.",
      progress:" 30",
    difficulty: "Beginner",
  },
  {
    id: 4,
    image: "/src/assets/course1.jpg",
    title: "Full-Stack Development",
    hours: "20",
    description:
      "Combine frontend and backend skills to build complete applications with React and Node.js.",
      progress:" 10",
    difficulty: "Hard",
  },
  {
    id: 5,
    image: "/src/assets/course1.jpg",
    title: "UI/UX Fundamentals",
    hours: "8",
    description:
      "Learn the essentials of designing clean and user-friendly web interfaces.",
      progress:" 90",
    difficulty: "Beginner",
    mandatory: true,
  },
  {
    id: 6,
    image: "/src/assets/course1.jpg",
    title: "Database Management",
    hours: "14",
    description:
      "Understand relational and NoSQL databases, including SQL queries and MongoDB.",
      progress:" 50",
    difficulty: "Beginner",
  }
  ];

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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleMandatoryFilterChange = (e) => {
    setMandatoryFilter(e.target.value);
  };

  const handleDifficultyFilterChange = (e) => {
    setDifficultyFilter(e.target.value);
  };

  return (
    <div className="mt-15 px-5 sm:px-10 mb-10 h-full min-h-scree">
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
        key={course.id}
        image={course.image}
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
