import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/authContext.jsx";
import { serverUrl } from "../../config.js";

const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [mandatoryCourses, setMandatoryCourses] = useState([]);
  const [enrolledEmployees, setEnrolledEmployees] = useState({});
  const [showEmployees, setShowEmployees] = useState({});
  const [loading, setLoading] = useState(true);
  const { logout } = useContext(AuthContext);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(
          `${serverUrl}/api/admin/dashboard`,
          { withCredentials: true }
        );
        setStats(res.data.stats);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchMandatoryCourses = async () => {
      try {
        const res = await axios.get(
          `${serverUrl}/api/admin/mandatory-courses`,
          { withCredentials: true }
        );
        setMandatoryCourses(res.data.courses);
      } catch (error) {
        console.error("Failed to fetch mandatory courses:", error);
      }
    };
    fetchMandatoryCourses();
  }, []);

  const handleShowEmployees = async (courseId) => {
    if (showEmployees[courseId]) {
      setShowEmployees({ ...showEmployees, [courseId]: false });
      return;
    }

    try {
      const res = await axios.get(
        `${serverUrl}/api/admin/course/${courseId}/enrolled-employees`,
        { withCredentials: true }
      );
      setEnrolledEmployees({
        ...enrolledEmployees,
        [courseId]: res.data.employees,
      });
      setShowEmployees({ ...showEmployees, [courseId]: true });
    } catch (error) {
      console.error("Failed to fetch enrolled employees:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-10 bg-transparent">

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-black">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 mt-1">
          Overview of employees, courses, and enrollments
        </p>
        <div className="mt-4 h-1 w-32 rounded-full bg-gradient-to-r from-orange-400 to-orange-600" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-12">
        {[
          { label: "Total Employees", value: stats.totalEmployees },
          { label: "Total Courses", value: stats.totalCourses },
          { label: "Mandatory Courses", value: stats.mandatoryCourses },
          { label: "Total Enrollments", value: stats.totalEnrollments },
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-white border border-orange-100 rounded-xl
              px-5 py-4
              shadow-[0_6px_18px_rgba(0,0,0,0.05)]
              hover:shadow-[0_10px_24px_rgba(0,0,0,0.07)]
              transition"
          >
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-black">
              {item.value || 0}
            </p>
          </div>
        ))}
      </div>

      {/* Mandatory Courses */}
      <div className="bg-white border border-orange-100 rounded-2xl
        shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-8">

        <h2 className="text-2xl font-bold text-black mb-6">
          Mandatory Courses ({mandatoryCourses.length})
        </h2>

        <div className="space-y-6">
          {mandatoryCourses.map((course) => (
            <div
              key={course._id}
              className="border-b border-gray-200 pb-6 last:border-none"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-black">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {course.description}
                  </p>
                </div>

                <button
                  onClick={() => handleShowEmployees(course._id)}
                  className="px-5 py-2 rounded-full text-sm font-semibold
                    bg-black text-white
                    hover:bg-gray-800 transition"
                >
                  {showEmployees[course._id]
                    ? "Hide Employees"
                    : "Show Employees"}
                </button>
              </div>

              {/* Smooth Expand / Collapse */}
              <div
                className={`transition-all duration-500 ease-in-out overflow-hidden
                  ${
                    showEmployees[course._id]
                      ? "max-h-[500px] opacity-100 mt-5"
                      : "max-h-0 opacity-0"
                  }
                `}
              >
                <h4 className="text-md font-semibold text-gray-700 mb-3">
                  Enrolled Employees (
                  {enrolledEmployees[course._id]?.length || 0})
                </h4>

                <ul className="space-y-3">
                  {enrolledEmployees[course._id]?.map((employee) => (
                    <li
                      key={employee._id}
                      className="flex justify-between items-center
                        bg-orange-50 p-4 rounded-xl"
                    >
                      <div>
                        <p className="text-sm font-medium text-black">
                          {employee.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {employee.email}
                        </p>
                      </div>
                    </li>
                  )) || (
                    <p className="text-sm text-gray-500">
                      No employees enrolled.
                    </p>
                  )}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
