import React from "react";
import { useNavigate } from "react-router-dom";

const CourseCard = ({ id, image, title, hours, description, difficulty, mandatory }) => {
  const navigate = useNavigate();

  const getDifficultyColor = (level) => {
    switch (level.toLowerCase()) {
      case "beginner":
        return "bg-green-100 text-green-700";
      case "intermediate":
        return "bg-yellow-100 text-yellow-700";
      case "hard":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div
      onClick={() => navigate(`/course/${title}`)}
      className={`ml-8 cursor-pointer bg-white rounded-xl overflow-hidden shadow-md transform transition duration-300 hover:scale-95 hover:shadow-xl w-70 h-80 relative`}
    >
      <img src={image} alt={title} className="w-full h-40 object-cover" />

      {/* Mandatory badge (top-left corner) */}
      {mandatory && (
        <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full shadow">
          Mandatory
        </span>
      )}

      <div className="p-4 flex flex-col justify-between h-40">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${getDifficultyColor(
              difficulty
            )}`}
          >
            {difficulty}
          </span>
        </div>

        <p className="text-sm text-gray-500">{hours} Hours</p>
        <p className="text-gray-600 text-sm line-clamp-2">{description}</p>
      </div>
    </div>
  );
};

export default CourseCard;
