import React, { useContext } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Login from "./pages/Login.jsx";
import MyLearning from "./pages/MyLearning.jsx";
import { ToastContainer } from "react-toastify";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PublicRoute from "./components/PublicRoute.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
// This hook must contain its API call inside a useEffect to prevent an infinite loop
import getCurrentEmployee from "./customHook/getCurrentEmployee.js";
import { AuthContext } from "./context/authContext.jsx";
import CourseDetail from "./pages/CourseDetail.jsx";

import { serverUrl } from "./config.js";
import adminRoute from "./components/admin/adminRoute.jsx";

const App = () => {
  const { isLoggedIn } = useContext(AuthContext);

  // Call the custom hook with isLoggedIn status
  getCurrentEmployee(isLoggedIn);

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
            <Route path="/admin" element={<ProtectedRoute><adminRoute /></ProtectedRoute>} >
            
            
            </Route>
          </Routes>
          <Footer />
        </ErrorBoundary>
      </div>
    </>
  );
};

export default App;
