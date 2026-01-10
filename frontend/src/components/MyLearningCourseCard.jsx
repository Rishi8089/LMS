import React from "react";
import { serverUrl } from "../config.js";

const MyLearningCourseCard = ({
  image,
  title,
  difficulty,
  hours,
  description,
  progress,
  mandatory,
  dueDate,
  onClick,
  chapters,
  status,
  completedLessons,
  totalLessons,
  quizCompleted,
  quizPassed,
}) => {
  const getDifficultyColor = (level) => {
    switch (level?.toLowerCase()) {
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

  const formatDueDate = (date) => {
    if (!date) return "No due date";
    const due = new Date(date);
    const now = new Date();
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    return `Due in ${diffDays} days`;
  };

  // Check if any lesson has pdfUrl in chapters - to decide if content is pdf
  const containsPdf = chapters?.some((chapter) =>
    chapter.lessons?.some((lesson) => lesson.pdfUrl)
  );

  return (
    <div
      className="bg-white rounded-xl overflow-hidden shadow-md transform transition duration-300 hover:scale-95 hover:shadow-xl w-full max-w-4xl cursor-pointer"
      onClick={onClick}
    >
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="md:w-1/2">
          <img
            src={
              image && image.startsWith("/uploads")
                ? `${serverUrl}${image}`
                : image
            }
            alt={title}
            className="w-full h-48 md:h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="md:w-2/3 p-6 flex flex-col justify-between">
          <div>
            {/* Title and Difficulty */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${getDifficultyColor(
                  difficulty
                )}`}
              >
                {difficulty}
              </span>
            </div>

            {/* Hours and Mandatory */}
            <div className="flex items-center gap-4 mb-2">
              {!containsPdf && hours && (
                <p className="text-sm text-gray-500">{Math.round(hours * 60)} Minutes</p>
              )}
              {mandatory && (
                <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                  Mandatory
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {description}
            </p>

            {/* Due Date */}
            <p className="text-sm mb-4 text-red-400 font-medium drop-shadow-[0_0_6px_rgba(248,113,113,0.7)]">
              {formatDueDate(dueDate)}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <div className="flex items-center gap-2">
                {status === 'completed' && (
                  <span className="text-green-600 font-semibold">✓ Completed</span>
                )}
                <span>{progress || 0}%</span>
                {totalLessons > 0 && (
                  <span className="text-xs text-gray-500">
                    ({completedLessons || 0}/{totalLessons} lessons)
                  </span>
                )}
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  status === 'completed' ? 'bg-green-600' : 'bg-blue-600'
                }`}
                style={{ width: `${progress || 0}%` }}
              ></div>
            </div>
            {status === 'completed' && (
              <p className="text-xs text-green-600 mt-1 font-medium">
                🎉 Course completed successfully!
              </p>
            )}
            {status === 'completed' && (
              <div className="mt-2">
                {quizCompleted ? (
                  quizPassed ? (
                    <p className="text-xs text-green-600 font-medium">
                      📝 Quiz passed ✓
                    </p>
                  ) : (
                    <p className="text-xs text-red-600 font-medium">
                      📝 Quiz failed ✗
                    </p>
                  )
                ) : (
                  <p className="text-xs text-orange-600 font-medium">
                    📝 Quiz pending - Complete to finish course
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyLearningCourseCard;
