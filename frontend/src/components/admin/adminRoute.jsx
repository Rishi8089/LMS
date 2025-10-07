import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import AdminDashboard from '../../pages/admin/AdminDashboard.jsx';
import ManageEmployees from '../../pages/admin/ManageEmployees.jsx';
import ManageCourses from '../../pages/admin/ManageCourses.jsx';
import { useAuth } from '../../context/authContext.jsx';

const AdminRoute = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen">
      <nav className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-bold mb-4">Admin Panel</h2>
        <ul>
          <li className="mb-2">
            <Link to="/admin" className="block py-2 px-4 rounded hover:bg-gray-700">Dashboard</Link>
          </li>
          <li className="mb-2">
            <Link to="/admin/employees" className="block py-2 px-4 rounded hover:bg-gray-700">Manage Employees</Link>
          </li>
          <li className="mb-2">
            <Link to="/admin/courses" className="block py-2 px-4 rounded hover:bg-gray-700">Manage Courses</Link>
          </li>
        </ul>
        <button onClick={handleLogout} className="mt-4 bg-red-600 text-white px-4 py-2 rounded w-full">
          Logout
        </button>
      </nav>
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/employees" element={<ManageEmployees />} />
          <Route path="/courses" element={<ManageCourses />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminRoute;
