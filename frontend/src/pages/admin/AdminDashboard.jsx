import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { serverUrl } from '../../config.js';

const AdminDashboard = () => {
  const [stats, setStats] = useState({});

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${serverUrl}/api/admin/dashboard`, { withCredentials: true });
        if (response.data.success) {
          setStats(response.data.stats);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold">Total Employees</h2>
          <p className="text-2xl">{stats.totalEmployees || 0}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold">Total Courses</h2>
          <p className="text-2xl">{stats.totalCourses || 0}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold">Mandatory Courses</h2>
          <p className="text-2xl">{stats.mandatoryCourses || 0}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold">Total Enrollments</h2>
          <p className="text-2xl">{stats.totalEnrollments || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
