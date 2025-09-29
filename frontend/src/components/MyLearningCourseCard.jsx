import React from "react";
import { useNavigate } from "react-router-dom";

const MyLearningCourseCard = ({ 
  image,
  title,
  difficulty,
  hours,
  description,
  progress = 60,
  mandatory = false,
  courseId,
}) => {
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
      className="flex flex-col w-200 sm:flex-row items-stretch bg-white rounded-2xl shadow-md overflow-hidden hover:scale-105 transition-transform duration-300 cursor-pointer"
      onClick={() => navigate(`/mylearning/${title}`)}
    >
      
      {/* Left: Image */}
      <div className="relative w-40 sm:w-40 sm:min-w-[160px] h-48 sm:h-auto flex-shrink-0">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover"
        />
        {/* Mandatory Badge */}
        {mandatory && (
         <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full shadow">
          Mandatory
        </span>
        )}
      </div>

      {/* Middle: Course Info */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        {/* Title + Hours */}
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h3 className="text-lg font-bold text-gray-900">
            {title}{" "}
            <span className={`font-medium px-2 py-1 rounded-full ${getDifficultyColor(difficulty)}`}>
              {difficulty}
            </span>
          </h3>
          <p className="text-sm font-semibold text-gray-800 sm:border-l sm:pl-2">
            {hours} hrs.
          </p>
        </div>

        {/* Description */}
        <p className="mt-2 text-sm text-gray-600">{description}</p>

        {/* Progress bar */}
        <div className="mt-3 w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-1.5 bg-blue-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Right: Arrow Section */}
      <div className="flex items-center justify-center w-full sm:w-12 h-12 sm:h-auto bg-black text-white">
        <span className="text-2xl font-bold">›</span>
      </div>
    </div>
  );
};

export default MyLearningCourseCard;
