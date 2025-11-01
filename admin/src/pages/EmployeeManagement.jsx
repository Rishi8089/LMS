import React, { useState, useEffect } from "react";
import axios from "axios";
import { serverUrl } from "../config.js";
import { toast } from "react-toastify";
// You might want to import icons here if you were using an icon library
// e.g., import { FaPencilAlt, FaTrash, FaBookOpen } from 'react-icons/fa';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  // Modal for viewing enrolled courses
  const [showCoursesModal, setShowCoursesModal] = useState(false);
  const [selectedEmployeeCourses, setSelectedEmployeeCourses] = useState([]);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  /**
   * Fetches all employee data from the server.
   */
  const fetchEmployees = async () => {
    setLoading(true); // Setting loading here ensures it shows on refetch too
    try {
      const res = await axios.get(`${serverUrl}/api/admin/employees`, {
        withCredentials: true,
      });
      // Assuming res.data.employees is an array of employee objects
      setEmployees(res.data.employees);
    } catch (error) {
      console.error("API call failed to fetch employees:", error.response?.data || error.message);
      toast.error("Failed to fetch employees. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles form input changes.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Handles form submission for adding or updating an employee.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        // Update Employee
        await axios.put(
          `${serverUrl}/api/admin/employee/${formData.id}`,
          {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            // Only send password if it's provided, otherwise the server will ignore it
            password: formData.password || undefined,
          },
          { withCredentials: true }
        );
        toast.success("Employee updated successfully 🎉");
      } else {
        // Add New Employee
        await axios.post(`${serverUrl}/api/admin/employee-register`, formData, {
          withCredentials: true,
        });
        toast.success("Employee registered successfully 🎉");
      }
      
      // Reset state after successful operation
      handleCancel(); 
      fetchEmployees();
    } catch (error) {
      console.error("API call failed to save employee:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to save employee");
    }
  };

  /**
   * Resets form data and hides the form.
   */
  const handleCancel = () => {
    setFormData({ id: "", name: "", email: "", phone: "", password: "" });
    setEditingEmployee(null);
    setShowForm(false);
  };

  /**
   * Sets the state to show the form for editing an existing employee.
   */
  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      id: employee._id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone || "",
      password: "", // Password is reset for security and should only be changed intentionally
    });
    setShowForm(true);
  };

  /**
   * Deletes an employee after confirmation.
   */
  const handleDelete = async (employee) => {
    if (window.confirm(`Are you sure you want to delete ${employee.name}? This action cannot be undone.`)) {
      try {
        await axios.delete(`${serverUrl}/api/admin/employee/${employee._id}`, {
          withCredentials: true,
        });
        toast.success("Employee deleted successfully 🗑️");
        fetchEmployees();
      } catch (error) {
        console.error("API call failed to delete employee:", error.response?.data || error.message);
        toast.error("Failed to delete employee. Check console for details.");
      }
    }
  };

  /**
   * Fetches the enrolled courses for a specific employee and shows the modal.
   */
  const handleViewCourses = async (employee) => {
    try {
      const res = await axios.get(
        `${serverUrl}/api/admin/employee/${employee._id}/courses`,
        { withCredentials: true }
      );
      // Assuming courses are returned in a 'courses' field
      setSelectedEmployeeCourses(res.data.courses || []);
      setSelectedEmployeeName(employee.name);
      setShowCoursesModal(true);
    } catch (error) {
      console.error("API call failed to fetch enrolled courses:", error.response?.data || error.message);
      toast.error("Failed to fetch enrolled courses. Check console for details.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg font-semibold">
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading Employee Data...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-center sm:text-left">
          👤 Employee Management
        </h1>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-black text-white px-6 py-3 rounded-xl shadow-md hover:bg-gray-700 transition duration-200 ease-in-out font-medium"
          >
            + Add New Employee
          </button>
        )}
      </div>

      {/* Employee Form / Table */}
      {showForm ? (
        // Employee Form
        <div className="bg-white w-full max-w-lg mx-auto p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center text-gray-800">
            {editingEmployee ? "✏️ Edit Employee" : "➕ Register New Employee"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <input
              type="text"
              name="name"
              placeholder="Enter Full Name..."
              value={formData.name}
              onChange={handleChange}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm sm:text-base"
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Enter Email Address..."
              value={formData.email}
              onChange={handleChange}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm sm:text-base"
              required
            />
            <input
              type="text"
              name="phone"
              placeholder="Enter Contact Number (Optional)..."
              value={formData.phone}
              onChange={handleChange}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm sm:text-base"
            />
            {/* Password input is required for new employee, optional for edit */}
            <input
              type="password"
              name="password"
              placeholder={editingEmployee ? "Enter New Password (Optional)" : "Enter Password..."}
              value={formData.password}
              onChange={handleChange}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm sm:text-base"
              required={!editingEmployee} // Required for new user, not for edit
            />

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-100 transition w-full sm:w-32 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                className=" bg-black text-white px-6 py-2 rounded-lg hover:bg-black transition w-full sm:w-32 font-medium order-1 sm:order-2"
              >
                {editingEmployee ? "Save Changes" : "Register"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        // Employee Table
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-center text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Courses
                  </th>
                  <th className="px-6 py-3 text-center text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-100">
                {employees.length === 0 ? (
                    <tr>
                        <td colSpan="5" className="px-6 py-6 text-center text-gray-500 text-base">
                            No employees found. Click "Add New Employee" to register one.
                        </td>
                    </tr>
                ) : (
                    employees.map((employee) => (
                    <tr key={employee._id} className="hover:bg-gray-50 transition duration-150">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                            {employee.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">
                            {employee.email}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">
                            {employee.phone || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-center">
                            <button
                                onClick={() => handleViewCourses(employee)}
                                className="bg-indigo-500 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-600 text-xs sm:text-sm font-medium transition"
                            >
                                View ({employee.enrolledCourses?.length || 0}) 📚
                            </button>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap space-x-2">
                            <button
                                onClick={() => handleEdit(employee)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium p-1 rounded transition"
                                title="Edit Employee"
                            >
                                Edit
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                                onClick={() => handleDelete(employee)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium p-1 rounded transition"
                                title="Delete Employee"
                            >
                                Delete
                            </button>
                        </td>
                    </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Courses Modal */}
      {showCoursesModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-opacity-10">
    {/* Backdrop */}
    <div
      className="absolute inset-0  bg-opacity-50"
      onClick={() => setShowCoursesModal(false)}
    ></div>

    {/* Modal Content */}
    <div
      className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto p-6 z-10 transform transition-all"
      onClick={e => e.stopPropagation()} // Prevent click propagation
    >
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 border-b pb-3">
        Courses for {selectedEmployeeName}
      </h2>
      {selectedEmployeeCourses.length > 0 ? (
        <div className="space-y-4">
          {selectedEmployeeCourses.map((course) => (
            <div
              key={course._id}
              className="border border-gray-200 bg-gray-50 rounded-lg p-4 hover:shadow-md transition duration-200"
            >
              <p className="font-semibold text-lg text-gray-900">{course.title}</p>
              {course.description && (
                <p className="text-gray-600 text-sm mt-1 mb-2 italic">
                  {course.description.length > 80
                    ? course.description.slice(0, 80) + "..."
                    : course.description}
                </p>
              )}
              <div className="flex justify-between mt-2 text-gray-500 text-xs font-medium">
                <span>🕒 Hours: {course.hours}</span>
                <span>⭐ Difficulty: {course.difficulty}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center text-base py-4">
          This employee has not enrolled in any courses yet.
        </p>
      )}

      <div className="mt-8 text-center">
        <button
          onClick={() => setShowCoursesModal(false)}
          className="bg-black text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition font-medium"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default EmployeeManagement;