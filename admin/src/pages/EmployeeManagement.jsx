import React, { useState, useEffect } from "react";
import axios from "axios";
import { serverUrl } from "../config.js";
import { toast } from "react-toastify";

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/admin/employees`, {
        withCredentials: true,
      });
      setEmployees(res.data.employees);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      toast.error("Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${serverUrl}/api/admin/employee-register`, formData, {
        withCredentials: true,
      });
      toast.success("Employee registered successfully");
      setFormData({ name: "", email: "", phone: "", password: "" });
      setShowForm(false);
      fetchEmployees();
    } catch (error) {
      console.error("Failed to register employee:", error);
      toast.error("Failed to register employee");
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", email: "", phone: "", password: "" });
    setShowForm(false);
  };

  const handleEdit = (employee) => {
    toast.info(`Edit employee: ${employee.name}`);
    // Open edit modal or inline edit form here
  };

  const handleShowDetails = (employee) => {
    toast.info(`Showing details for: ${employee.name}`);
    // Navigate to details page or open modal here
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Employee Management</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
          >
            Add Employee
          </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-gray-50 w-full max-w-md mx-auto p-8 rounded-2xl shadow-lg mt-15">
          <h2 className="text-xl font-bold mb-6 text-center">Add New Employee</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="text"
              name="name"
              placeholder="Enter Full Name..."
              value={formData.name}
              onChange={handleChange}
              className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:outline-none"
              required
            />

            <input
              type="email"
              name="email"
              placeholder="Enter Email Address..."
              value={formData.email}
              onChange={handleChange}
              className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:outline-none"
              required
            />

            <input
              type="text"
              name="phone"
              placeholder="Enter Contact Number..."
              value={formData.phone}
              onChange={handleChange}
              className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:outline-none"
            />

            <input
              type="password"
              name="password"
              placeholder="Enter Password..."
              value={formData.password}
              onChange={handleChange}
              className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:outline-none"
              required
            />

            <div className="flex justify-center gap-4 pt-4">
              <button
                type="submit"
                className="bg-black text-white px-6 py-2 rounded-xl hover:bg-gray-800 w-32"
              >
                Submit
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-xl hover:bg-gray-400 w-32"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden ">
          <table className="min-w-full divide-y divide-gray-200 text-center">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Enrolled Courses
                </th>
                <th className="px-6 py-3 text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Edit
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-center">
              {employees.map((employee) => (
                <tr key={employee._id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {employee.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{employee.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {employee.phone || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {employee.enrolledCourses?.length || 0}
                  </td>

                  {/* Show Details Button */}
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleShowDetails(employee)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Details
                    </button>
                  </td>

                  {/* Edit Button */}
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleEdit(employee)}
                      className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
