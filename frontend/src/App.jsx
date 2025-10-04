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
// This hook must contain its API call inside a useEffect to prevent an infinite loop
import getCurrentEmployee from "./customHook/getCurrentEmployee.js";
import { AuthContext } from "./context/authContext.jsx";

export const serverUrl = "http://localhost:8000";

const App = () => {
  const { isLoggedIn } = useContext(AuthContext);

  // Call the custom hook with isLoggedIn status
  getCurrentEmployee(isLoggedIn);

  return (
    <>
      <div className="relative z-10">
        <Navbar />
        <ToastContainer />
        <Routes>
          {/* Public route: Allows access if not logged in. Redirects to / if logged in. */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          
          {/* Protected routes: Requires login. Redirects to /login if not logged in. */}
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/mylearning" element={<ProtectedRoute><MyLearning /></ProtectedRoute>} />
        </Routes>
        <Footer />
      </div>
    </>
  );
};

export default App;