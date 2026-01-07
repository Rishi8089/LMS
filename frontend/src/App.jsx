import React, { useContext } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Login from "./pages/Login.jsx";
import MyLearning from "./pages/MyLearning.jsx";
import Player from "./pages/Player.jsx";
import { ToastContainer } from "react-toastify";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PublicRoute from "./components/PublicRoute.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
// This hook must contain its API call inside a useEffect to prevent an infinite loop
import getCurrentEmployee from "./customHook/getCurrentEmployee.js";
import { AuthContext } from "./context/authContext.jsx";
import CourseDetail from "./pages/CourseDetail.jsx";
import Profile from "./pages/Profile.jsx";
import Quiz from "./pages/quiz.jsx";


// Admin components
import AdminDashboard from "./pages/admin/Dashboard.jsx";
import EmployeeManagement from "./pages/admin/EmployeeManagement.jsx";
import CourseManagement from "./pages/admin/CourseManagement.jsx";
import AdminHeader from "./components/admin/Header.jsx";
import AdminSideBar from "./components/admin/SideBar.jsx";
import AdminFooter from "./components/admin/Footer.jsx";

import { serverUrl } from "./config.js";

const App = () => {
  const { isLoggedIn, isAdmin } = useContext(AuthContext);

  // Call the custom hook with isLoggedIn status
  getCurrentEmployee(isLoggedIn);

  if (isAdmin) {
    return (
      <>
        <ToastContainer />
        <AdminHeader />
        <div className="flex">
          <AdminSideBar />
          <div className="flex-1 bg-gray-100 min-h-screen">
            <Routes>
              <Route path="/dashboard" element={<AdminDashboard />} />
              <Route path="/employees" element={<EmployeeManagement />} />
              <Route path="/courses" element={<CourseManagement />} />
              <Route path="/" element={<AdminDashboard />} />
              <Route path="*" element={<AdminDashboard />} />
            </Routes>
          </div>
        </div>
        <AdminFooter />
      </>
    );
  }

  return (
    <>
      <div className="relative z-10">
        <ErrorBoundary>
          <Navbar />
          <ToastContainer />
          <Routes>
            {/* Public route: Allows access if not logged in. Redirects to / if logged in. */}

            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

            {/* Protected routes: Requires login. Redirects to /login if not logged in. */}
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/course/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
            <Route path="/mylearning" element={<ProtectedRoute><MyLearning /></ProtectedRoute>} />
            <Route path="/player/:courseId" element={<ProtectedRoute><Player /></ProtectedRoute>} />
            <Route path="/quiz/:courseId" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="*" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          </Routes>
          <Footer />
        </ErrorBoundary>
      </div>
    </>
  );
};

export default App;
