import React from "react";

const SearchBar = ({
  searchTerm,
  setSearchTerm,
  mandatoryFilter,
  setMandatoryFilter,
  difficultyFilter,
  setDifficultyFilter,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
      {/* Search by Name */}
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search by course name..."
        className="w-full sm:w-2/5 px-4 py-2 border border-gray-600 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
      />

      {/* Filter by Mandatory */}
      <select
        value={mandatoryFilter}
        onChange={(e) => setMandatoryFilter(e.target.value)}
        className="w-full sm:w-auto px-4 py-2 border border-gray-600 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
      >
        <option value="all">All Courses</option>
        <option value="true">Mandatory</option>
        <option value="false">Optional</option>
      </select>

      {/* Filter by Difficulty */}
      <select
        value={difficultyFilter}
        onChange={(e) => setDifficultyFilter(e.target.value)}
        className="w-full sm:w-auto px-4 py-2 border border-gray-600 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
      >
        <option value="all">All Levels</option>
        <option value="Beginner">Beginner</option>
        <option value="Intermediate">Intermediate</option>
        <option value="Hard">Hard</option>
      </select>
    </div>
  );
};

export default SearchBar;
