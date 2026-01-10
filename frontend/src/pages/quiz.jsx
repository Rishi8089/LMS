import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiClock, FiCheckCircle, FiAlertCircle, FiChevronRight, FiChevronLeft } from "react-icons/fi";
import { Loader2 } from "lucide-react";
import { serverUrl } from "../config.js";

const Quiz = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  // --- State Management ---
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { questionId: [selectedOption] }
  const [timeLeft, setTimeLeft] = useState(null); // in seconds
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  // --- Fetch Quiz Data ---
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await axios.get(`${serverUrl}/api/employee/courses/${courseId}/quiz`, {
          withCredentials: true,
        });

        if (res.data.success && res.data.quiz) {
          const fetchedQuiz = res.data.quiz;
          setQuiz(fetchedQuiz);

          // Initialize timer if a limit is set
          if (fetchedQuiz.timeLimitMins > 0) {
            setTimeLeft(fetchedQuiz.timeLimitMins * 60);
          }
        } else {
          // Handle cases where quiz cannot be taken
          const errorMessage = res.data?.message || "Unable to access quiz.";
          toast.error(errorMessage);
          navigate(-1);
        }
      } catch (error) {
        console.error("Error fetching quiz:", error);
        const errorMessage = error.response?.data?.message || "Failed to load quiz.";
        toast.error(errorMessage);
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [courseId, navigate]);

  // --- Timer Logic ---
  useEffect(() => {
    if (timeLeft === null || isSubmitted) return;

    if (timeLeft <= 0) {
      handleSubmit(); // Auto-submit when time is up
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, isSubmitted]);

  // Helper: Format Time (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // --- Handle User Interaction ---
  const handleOptionSelect = (option) => {
    if (isSubmitted) return;

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const isMultiple = currentQuestion.type === "mcq_multiple";

    setUserAnswers((prev) => {
      const currentAnswer = prev[currentQuestion._id] || [];
      
      if (isMultiple) {
        // Toggle selection for multiple choice
        if (currentAnswer.includes(option)) {
          return { ...prev, [currentQuestion._id]: currentAnswer.filter((o) => o !== option) };
        } else {
          return { ...prev, [currentQuestion._id]: [...currentAnswer, option] };
        }
      } else {
        // Single choice replacement
        return { ...prev, [currentQuestion._id]: [option] };
      }
    });
  };

  // --- Submit Quiz ---
  const handleSubmit = async () => {
    if (isSubmitted) return;

    // Optional: Confirm if manual submit and time remains
    if (timeLeft > 0 && !window.confirm("Are you sure you want to submit?")) return;

    setIsSubmitted(true);
    setLoading(true);

    try {
      // Prepare payload: array of { questionId, selectedOptions }
      const answersPayload = Object.keys(userAnswers).map((qId) => ({
        questionId: qId,
        selectedOptions: userAnswers[qId],
      }));

      const res = await axios.post(
        `${serverUrl}/api/employee/courses/${courseId}/quiz/submit`,
        { answers: answersPayload },
        { withCredentials: true }
      );

      setResult(res.data.result);
      toast.success("Quiz submitted successfully!");
    } catch (error) {
      console.error("Submit Error:", error);
      toast.error("Failed to submit quiz.");
      setIsSubmitted(false); // Allow retry if it was a network error
    } finally {
      setLoading(false);
    }
  };

  // --- Styles ---
  const cardClass = "bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-3xl mx-auto mt-8";
  const btnBlack = "bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold text-sm transition-all shadow-md";
  const optionBaseClass = "w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 relative hover:bg-gray-50";

  // --- Loading State ---
  if (loading && !quiz && !result) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  // --- RESULT VIEW (After Submission) ---
  if (isSubmitted && result) {
    const isPassed = result.passed;
    return (
      <div className="min-h-screen bg-gray-50/50 p-6 flex items-center justify-center font-sans">
        <div className={`${cardClass} w-full text-center p-12 border-t-8 ${isPassed ? "border-green-500" : "border-red-500"}`}>
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${isPassed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
            {isPassed ? <FiCheckCircle size={48} /> : <FiAlertCircle size={48} />}
          </div>
          
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            {isPassed ? "Congratulations! 🎉" : "Keep Learning! 📚"}
          </h2>
          <p className="text-gray-500 mb-10 text-lg">
            You {isPassed ? "passed" : "did not pass"} the <strong>{quiz.title}</strong> quiz.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-2xl mx-auto">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Score</p>
              <p className={`text-2xl font-black mt-1 ${isPassed ? "text-green-600" : "text-red-600"}`}>
                {result.score}%
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Correct</p>
              <p className="text-2xl font-black text-gray-800 mt-1">
                {result.correctCount} <span className="text-sm text-gray-400 font-medium">/ {result.totalQuestions}</span>
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Attempts</p>
              <p className="text-2xl font-black text-gray-800 mt-1">
                {result.attempts} <span className="text-sm text-gray-400 font-medium">/ {quiz.maxAttempts}</span>
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Result</p>
              <p className={`text-xl font-bold mt-2 ${isPassed ? "text-green-600" : "text-red-600"}`}>
                {isPassed ? "PASSED" : "FAILED"}
              </p>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            {result.canRetake && (
              <button
                onClick={() => window.location.reload()}
                className={`${btnBlack} bg-orange-600 hover:bg-orange-700`}
              >
                Retake Quiz
              </button>
            )}
            <button onClick={() => navigate(-1)} className={btnBlack}>
              Return to Course
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- QUIZ TAKING VIEW ---
  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Quiz Not Available</h2>
          <p className="text-gray-600 mb-6">This course doesn't have a quiz or the quiz has no questions.</p>
          <button onClick={() => navigate(-1)} className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold">
            Return to Course
          </button>
        </div>
      </div>
    );
  }

  const currentQ = quiz.questions[currentQuestionIndex];
  const isSelected = (opt) => (userAnswers[currentQ._id] || []).includes(opt);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans">
      
      {/* Header */}
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{quiz.title}</h1>
          <p className="text-sm text-gray-500 font-medium">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
            {quiz.attemptsUsed && quiz.maxAttempts && (
              <span className="ml-4 text-orange-600 font-semibold">
                Attempt {quiz.attemptsUsed.length} of {quiz.maxAttempts}
              </span>
            )}
          </p>
        </div>

        {timeLeft !== null && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold shadow-sm ${timeLeft < 60 ? "bg-red-100 text-red-600 animate-pulse" : "bg-white text-gray-800"}`}>
            <FiClock /> {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Question Card */}
      <div className={`${cardClass} mt-0 min-h-[500px] flex flex-col border-t-4 border-t-orange-500`}>
        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-gray-100">
          <div 
            className="h-full bg-orange-500 transition-all duration-500 ease-out" 
            style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
          />
        </div>

        <div className="p-8 md:p-10 flex-1">
          <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-8 leading-snug">
            {currentQ.text}
          </h3>

          <div className="space-y-4">
            {currentQ.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleOptionSelect(option)}
                className={`
                  ${optionBaseClass}
                  ${isSelected(option) 
                    ? "border-orange-500 bg-orange-50 text-orange-900 font-semibold shadow-inner" 
                    : "border-gray-200 bg-white text-gray-600 hover:border-orange-300"
                  }
                `}
              >
                <div className={`flex-shrink-0 w-6 h-6 rounded border flex items-center justify-center transition-all duration-200
                  ${isSelected(option) ? "border-orange-500 bg-orange-500 text-white" : "border-gray-300 bg-white"}
                `}>
                  {/* Render Checkmark or Dot based on type */}
                  {isSelected(option) && (
                     currentQ.type === "mcq_multiple" ? <FiCheckCircle size={14} /> : <div className="w-2.5 h-2.5 bg-white rounded-full" />
                  )}
                </div>
                <span className="text-sm md:text-base">{option}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <button
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 text-gray-500 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed font-semibold px-4 py-2 transition-colors"
          >
            <FiChevronLeft /> Previous
          </button>

          {currentQuestionIndex === quiz.questions.length - 1 ? (
            <button 
              onClick={handleSubmit} 
              className={`${btnBlack} bg-green-600 hover:bg-green-700`}
            >
              Submit Quiz
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestionIndex((prev) => Math.min(quiz.questions.length - 1, prev + 1))}
              className={btnBlack}
            >
              Next Question <FiChevronRight className="inline ml-1" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;