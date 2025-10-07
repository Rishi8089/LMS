import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { serverUrl } from '../../config.js';
import { toast } from 'react-toastify';

const ManageEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${serverUrl}/api/employee/all`, { withCredentials: true });
      if (response.data.success) {
        setEmployees(response.data.employees);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleRegister = async () => {
    try {
      const response = await axios.post(`${serverUrl}/api/admin/employee-register`, formData, { withCredentials: true });
      if (response.data.success) {
        toast.success('Employee registered successfully');
        setShowForm(false);
        setFormData({ name: '', email: '', password: '' });
        fetchEmployees();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Manage Employees</h1>
      <button
        onClick={() => setShowForm(!showForm)}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
      >
        {showForm ? 'Cancel' : 'Add Employee'}
      </button>
      {showForm && (
        <div className="bg-white p-4 rounded shadow mb-4">
          <input
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="border p-2 mr-2"
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="border p-2 mr-2"
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="border p-2 mr-2"
          />
          <button onClick={handleRegister} className="bg-green-600 text-white px-4 py-2 rounded">
            Register
          </button>
        </div>
      )}
      <div className="bg-white rounded shadow">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Enrolled Courses</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp._id} className="border-t">
                <td className="p-2">{emp.name}</td>
                <td className="p-2">{emp.email}</td>
                <td className="p-2">{emp.enrolledCourses?.length || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageEmployees;
