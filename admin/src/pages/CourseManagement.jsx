import React, { useState, useEffect } from "react";
import axios from "axios";
import { serverUrl } from "../config.js";
import { toast } from "react-toastify";
// Consider importing icons for a professional look, e.g., from 'react-icons'

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    hours: "",
    difficulty: "Beginner",
    mandatory: false,
    images: "",
  });

  // Fetch all courses on component mount
  useEffect(() => {
    fetchCourses();
  }, []);

  /**
   * Fetches all courses from the server.
   */
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${serverUrl}/api/admin/courses`, {
        withCredentials: true,
      });
      setCourses(res.data.courses || []);
    } catch (error) {
      console.error("❌ API call failed to fetch courses:", error.response?.data || error.message);
      toast.error("Failed to fetch courses. Please check your network or server status.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles form input changes, including special handling for checkboxes.
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /**
   * Handles form submission for creating a new course or updating an existing one.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        // Update existing course
        await axios.put(
          `${serverUrl}/api/admin/courses/${editingCourse._id}`,
          {
            ...formData,
            // Ensure hours is a number
            hours: Number(formData.hours),
          },
          { withCredentials: true }
        );
        toast.success("Course updated successfully! ✏️");
      } else {
        // Create new course
        await axios.post(
          `${serverUrl}/api/admin/courses`,
          {
            ...formData,
            hours: Number(formData.hours),
          },
          { withCredentials: true }
        );
        toast.success("Course created successfully! ✨");
      }

      resetForm();
      fetchCourses();
    } catch (error) {
      console.error("❌ API call failed to save course:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to save course");
    }
  };

  /**
   * Resets form data and hides the form.
   */
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      hours: "",
      difficulty: "Beginner",
      mandatory: false,
      images: "",
    });
    setEditingCourse(null);
    setShowForm(false);
  };

  // Alias for readability
  const handleCancel = () => resetForm();

  /**
   * Sets the state for editing an existing course.
   */
  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title || "",
      description: course.description || "",
      hours: course.hours.toString() || "", // Convert to string for the input field
      difficulty: course.difficulty || "Beginner",
      mandatory: !!course.mandatory,
      images: course.images || "",
    });
    setShowForm(true);
  };

  /**
   * Deletes a course after user confirmation.
   */
  const handleDelete = async (course) => {
    if (window.confirm(`Are you sure you want to delete the course "${course.title}"? This cannot be undone.`)) {
      try {
        await axios.delete(`${serverUrl}/api/admin/courses/${course._id}`, {
          withCredentials: true,
        });
        toast.success("Course deleted successfully! 🗑️");
        fetchCourses();
      } catch (error) {
        console.error("❌ API call failed to delete course:", error.response?.data || error.message);
        toast.error("Failed to delete course. Check server logs.");
      }
    }
  };

  // Loading UI with better indicator
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl font-semibold text-gray-700">
        <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading Course Data...
      </div>
    );
  }

  // Main UI Render
  return (
    <div className="min-h-screen p-4 sm:p-8 ">
      
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          📚 Course Management
        </h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-black text-white px-6 py-3 rounded-xl shadow-lg hover: transition duration-200 ease-in-out font-medium"
          >
            + Add New Course
          </button>
        )}
      </div>

      {/* Course Form / Table Switch */}
      {showForm ? (
        // Course Form (Refined styling)
        <div className="bg-white w-full max-w-lg mx-auto p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center text-gray-800">
            {editingCourse ? "✏️ Edit Course" : "➕ Create New Course"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="title"
              placeholder="Course Title (e.g., Advanced JavaScript)"
              value={formData.title}
              onChange={handleChange}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              required
            />

            <textarea
              name="description"
              placeholder="Course Description..."
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              required
            />

            <input
              type="number"
              name="hours"
              placeholder="Total Course Hours (e.g., 20)"
              value={formData.hours}
              onChange={handleChange}
              min="1"
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              required
            />

            <select
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white"
              required
            >
              <option value="Beginner">Beginner 🟢</option>
              <option value="Intermediate">Intermediate 🟡</option>
              <option value="Hard">Expert 🔴</option>
            </select>

            <label className="flex items-center text-base text-gray-700 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition">
              <input
                type="checkbox"
                name="mandatory"
                checked={formData.mandatory}
                onChange={handleChange}
                className="mr-3 h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              Mandatory Course (Employee must complete this)
            </label>

            <input
              type="url" // Changed to type="url" for better input validation hint
              name="images"
              placeholder="Image URL (optional)..."
              value={formData.images}
              onChange={handleChange}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
            />

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-200 transition w-full sm:w-32 order-2 sm:order-1 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-black text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 w-full sm:w-32 transition order-1 sm:order-2 font-medium"
              >
                {editingCourse ? "Save" : "Create"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        // Course Table (Refined styling and empty state)
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-center text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="px-6 py-3 text-center text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                    Difficulty
                  </th>
                  <th className="px-6 py-3 text-center text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                    Mandatory
                  </th>
                  <th className="px-6 py-3 text-center text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-6 text-center text-gray-500 text-base">
                      No courses found. Click "Add New Course" to create your first one!
                    </td>
                  </tr>
                ) : (
                  courses.map((course) => (
                    <tr key={course._id} className="hover:bg-gray-50 transition duration-150">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap text-left">
                        {course.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 text-center">
                        {course.hours}h
                      </td>
                      <td className="px-6 py-4 text-sm text-center hidden sm:table-cell">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          course.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                          course.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {course.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-center hidden md:table-cell">
                        {course.mandatory ? '✅ Yes' : '❌ No'}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap space-x-3">
                        <button
                          onClick={() => handleEdit(course)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium p-1 rounded transition"
                          title="Edit Course"
                        >
                          Edit
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => handleDelete(course)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium p-1 rounded transition"
                          title="Delete Course"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;