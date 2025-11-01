import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/authContext.jsx';
import { serverUrl } from '../config.js';

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
        const res = await axios.get(`${serverUrl}/api/admin/dashboard`, { withCredentials: true });
        setStats(res.data.stats);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchMandatoryCourses = async () => {
      try {
        const res = await axios.get(`${serverUrl}/api/admin/mandatory-courses`, { withCredentials: true });
        setMandatoryCourses(res.data.courses);
      } catch (error) {
        console.error('Failed to fetch mandatory courses:', error);
      }
    };
    fetchMandatoryCourses();
  }, []);

  const handleLogout = () => {
    logout();
  };

  const handleShowEmployees = async (courseId) => {
    if (showEmployees[courseId]) {
      setShowEmployees({ ...showEmployees, [courseId]: false });
      return;
    }
    try {
      const res = await axios.get(`${serverUrl}/api/admin/course/${courseId}/enrolled-employees`, { withCredentials: true });
      setEnrolledEmployees({ ...enrolledEmployees, [courseId]: res.data.employees });
      setShowEmployees({ ...showEmployees, [courseId]: true });
    } catch (error) {
      console.error('Failed to fetch enrolled employees:', error);
    }
  };

  const handleReminder = (employeeName) => {
    // Placeholder for future reminder functionality
    alert(`Reminder sent to ${employeeName}`);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">E</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Employees</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalEmployees}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">C</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Courses</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalCourses}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">M</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Mandatory Courses</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.mandatoryCourses}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">En</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Enrollments</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalEnrollments}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Mandatory Courses ({mandatoryCourses.length})</h2>
              <div className="space-y-4">
                {mandatoryCourses.map((course) => (
                  <div key={course._id} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{course.title}</h3>
                        <p className="text-sm text-gray-500">{course.description}</p>
                      </div>
                      <button
                        onClick={() => handleShowEmployees(course._id)}
                        className="bg-black hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                      >
                        {showEmployees[course._id] ? 'Hide Employees' : 'Show Employees'}
                      </button>
                    </div>
                    {showEmployees[course._id] && (
                      <div className="mt-4">
                        <h4 className="text-md font-medium text-gray-700 mb-2">Enrolled Employees ({enrolledEmployees[course._id]?.length || 0})</h4>
                        <ul className="space-y-2">
                          {enrolledEmployees[course._id]?.map((employee) => (
                            <li key={employee._id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                                <p className="text-sm text-gray-500">{employee.email}</p>
                              </div>
                              <button
                                onClick={() => handleReminder(employee.name)}
                                className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded text-sm"
                              >
                                Reminder
                              </button>
                            </li>
                          )) || <p className="text-sm text-gray-500">No employees enrolled.</p>}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
};

export default Dashboard;
