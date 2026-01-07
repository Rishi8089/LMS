import React from 'react';
import { useAuth } from '../context/authContext.jsx';
import getCurrentEmployee from '../customHook/getCurrentEmployee.js';

const Profile = () => {
  const { isLoggedIn } = useAuth();
  const employee = getCurrentEmployee(isLoggedIn);

  if (!employee) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="h-141 py-12 px-4 sm:px-6 lg:px-8">
  <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out overflow-hidden">
    <div className="px-6 py-8">
      <h1 className="text-3xl font-extrabold text-indigo-600 text-center mb-6">👤 Employee Profile</h1>

      <div className="space-y-5 text-sm text-gray-700">
        <div className="flex justify-between items-center border-b pb-2">
          <span className="font-semibold text-gray-500">Name:</span>
          <span className="text-gray-900">{employee.name}</span>
        </div>

        <div className="flex justify-between items-center border-b pb-2">
          <span className="font-semibold text-gray-500">Email:</span>
          <span className="text-gray-900">{employee.email}</span>
        </div>

        <div className="flex justify-between items-center border-b pb-2">
          <span className="font-semibold text-gray-500">Phone:</span>
          <span className="text-gray-900">{employee.phone || 'N/A'}</span>
        </div>

        <div className="flex justify-between items-center border-b pb-2">
          <span className="font-semibold text-gray-500">Role:</span>
          <span className="text-gray-900">Employee</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-500">Enrolled Courses:</span>
          <span className="text-gray-900">{employee.enrolledCourses?.length || 0}</span>
        </div>
      </div>
    </div>
  </div>
</div>

  );
};

export default Profile;
