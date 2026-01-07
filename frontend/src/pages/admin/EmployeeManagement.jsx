import React, { useState, useEffect } from "react";
import axios from "axios";
import { serverUrl } from "../../config.js";
import { toast } from "react-toastify";

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [courses, setCourses] = useState([]);
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

  useEffect(() => {
    fetchEmployees();
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/admin/courses`, {
        withCredentials: true,
      });
      if (res.data?.courses) setCourses(res.data.courses);
    } catch {
      toast.error("Failed to fetch courses");
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${serverUrl}/api/admin/employees`, {
        withCredentials: true,
      });
      setEmployees(res.data.employees);
    } catch {
      toast.error("Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await axios.put(
          `${serverUrl}/api/admin/employee/${formData.id}`,
          {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            password: formData.password || undefined,
          },
          { withCredentials: true }
        );
        toast.success("Employee updated successfully");
      } else {
        await axios.post(`${serverUrl}/api/admin/employee-register`, formData, {
          withCredentials: true,
        });
        toast.success("Employee registered successfully");
      }
      handleCancel();
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  const handleCancel = () => {
    setFormData({ id: "", name: "", email: "", phone: "", password: "" });
    setEditingEmployee(null);
    setShowForm(false);
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      id: employee._id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone || "",
      password: "",
    });
    setShowForm(true);
  };

  const handleDelete = async (employee) => {
    if (!window.confirm(`Delete ${employee.name}?`)) return;
    try {
      await axios.delete(`${serverUrl}/api/admin/employee/${employee._id}`, {
        withCredentials: true,
      });
      toast.success("Employee deleted");
      fetchEmployees();
    } catch {
      toast.error("Delete failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading employee data…
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-10 bg-transparent">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-black">
            Employee Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage employees and their access
          </p>
          <div className="mt-3 h-1 w-28 rounded-full bg-gradient-to-r from-orange-400 to-orange-600" />
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="
              bg-black text-white
              px-7 py-4               /* ✅ FIXED HEIGHT */
              rounded-xl
              text-sm font-semibold
              hover:bg-gray-800 transition
            "
          >
            + Add Employee
          </button>
        )}
      </div>

      {/* Form */}
      {showForm ? (
        <div
          className="max-w-xl mx-auto bg-white border border-orange-100
          rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-8"
        >
          <h2 className="text-2xl font-bold text-black mb-6 text-center">
            {editingEmployee ? "Edit Employee" : "Register Employee"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {["name", "email", "phone", "password"].map((field) => (
              <input
                key={field}
                type={field === "password" ? "password" : "text"}
                name={field}
                placeholder={`Enter ${field}`}
                value={formData[field]}
                onChange={handleChange}
                required={
                  field !== "phone" &&
                  !(editingEmployee && field === "password")
                }
                className="w-full px-4 py-3 rounded-lg border border-gray-300
                  focus:ring-2 focus:ring-orange-300 focus:outline-none"
              />
            ))}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-black text-white hover:bg-gray-800 text-sm"
              >
                {editingEmployee ? "Save" : "Register"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Table */
<div
  className="bg-white border border-orange-100 rounded-2xl
  shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden"
>
  <div className="overflow-x-auto">
    <table className="min-w-full border-collapse table-fixed">
      
      {/* Header */}
      <thead className="bg-orange-50">
        <tr>
          <th className="w-[22%] px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
            Name
          </th>
          <th className="w-[30%] px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
            Email
          </th>
          <th className="w-[18%] px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
            Phone
          </th>
          <th className="w-[4%] px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
            Edit
          </th>
          <th className="w-[5%] px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
            Delete
          </th>
        </tr>
      </thead>

      {/* Body */}
      <tbody className="divide-y divide-gray-100">
        {employees.map((emp) => (
          <tr
            key={emp._id}
            className="hover:bg-gray-50 transition-colors"
          >
            {/* Name */}
            <td className="px-6 py-4 text-sm font-medium text-black truncate">
              {emp.name}
            </td>

            {/* Email */}
            <td className="px-6 py-4 text-sm text-gray-600 truncate">
              {emp.email}
            </td>

            {/* Phone */}
            <td className="px-6 py-4 text-sm text-gray-600">
              {emp.phone || "—"}
            </td>

            {/* Edit */}
            <td className="px-6 py-4 text-center">
              <button
                onClick={() => handleEdit(emp)}
                className="
                  px-4 py-1.5
                  text-sm font-semibold
                  text-blue-600
                  border border-blue-200
                  rounded-lg
                  hover:bg-blue-50
                  transition
                "
              >
                Edit
              </button>
            </td>

            {/* Delete */}
            <td className="px-6 py-4 text-center">
              <button
                onClick={() => handleDelete(emp)}
                className="
                  px-4 py-1.5
                  text-sm font-semibold
                  text-red-600
                  border border-red-200
                  rounded-lg
                  hover:bg-red-50
                  transition
                "
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>

    </table>
  </div>
</div>

      )}
    </div>
  );
};

export default EmployeeManagement;
