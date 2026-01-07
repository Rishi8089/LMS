import React, { useEffect, useState } from "react";
import axios from "axios";
import { serverUrl } from "../../config.js";

const AdminDashboard = () => {
  const [stats, setStats] = useState({});

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(
          `${serverUrl}/api/admin/dashboard`,
          { withCredentials: true }
        );
        if (response.data.success) {
          setStats(response.data.stats);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen px-6 py-10 bg-transparent">
      
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-black tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 mt-1">
          Platform overview and key statistics
        </p>
        <div className="mt-4 h-1 w-28 rounded-full 
          bg-gradient-to-r from-orange-400 to-orange-600" />
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

        {/* Card */}
        <div className="rounded-2xl bg-white p-6
          border border-orange-100
          shadow-[0_8px_24px_rgba(0,0,0,0.05)]
          transition hover:shadow-[0_12px_30px_rgba(0,0,0,0.07)]">
          <p className="text-sm font-medium text-gray-600">
            Total Employees
          </p>
          <p className="mt-3 text-3xl font-bold text-black">
            {stats.totalEmployees || 0}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white p-6
          border border-orange-100
          shadow-[0_8px_24px_rgba(0,0,0,0.05)]
          transition hover:shadow-[0_12px_30px_rgba(0,0,0,0.07)]">
          <p className="text-sm font-medium text-gray-600">
            Total Courses
          </p>
          <p className="mt-3 text-3xl font-bold text-black">
            {stats.totalCourses || 0}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white p-6
          border border-orange-100
          shadow-[0_8px_24px_rgba(0,0,0,0.05)]
          transition hover:shadow-[0_12px_30px_rgba(0,0,0,0.07)]">
          <p className="text-sm font-medium text-gray-600">
            Mandatory Courses
          </p>
          <p className="mt-3 text-3xl font-bold text-black">
            {stats.mandatoryCourses || 0}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white p-6
          border border-orange-100
          shadow-[0_8px_24px_rgba(0,0,0,0.05)]
          transition hover:shadow-[0_12px_30px_rgba(0,0,0,0.07)]">
          <p className="text-sm font-medium text-gray-600">
            Total Enrollments
          </p>
          <p className="mt-3 text-3xl font-bold text-black">
            {stats.totalEnrollments || 0}
          </p>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
