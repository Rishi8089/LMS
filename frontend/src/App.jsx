import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Login from "./pages/login.jsx";
import MyLearning from "./pages/MyLearning.jsx";
import { ToastContainer } from "react-toastify";
import ProtectedRoute from "./components/protectedRoute.jsx";
import PublicRoute from "./components/publicRoute.jsx";

export const serverUrl = "http://localhost:8000";

const App = () => {
  return (
    <>
      <div className="relative z-10">
        <Navbar />
        <ToastContainer />
        <Routes>
          {/* 👇 now login is protected as a "public" route */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>}/>
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>}/>
          <Route path="/mylearning" element={<ProtectedRoute><MyLearning /></ProtectedRoute>}/>
          
        </Routes>
        <Footer />
      </div>
    </>
  );
};

export default App;
