import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import './App.css'
import { ToastContainer } from "react-toastify";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import EmployeeManagement from "./pages/EmployeeManagement.jsx";
import CourseManagement from "./pages/CourseManagement.jsx";
import { AuthContext } from "./context/authContext.jsx";
import SideBar from "./components/SideBar.jsx";
import Footer from "./components/Footer.jsx";
import Header from "./components/Header.jsx";

function App() {
  const { isLoggedIn, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <ToastContainer />
      <Header />
      <div className="flex">
        <SideBar />
        <div className="flex-1">
          <Routes>
            <Route path="/login" element={!isLoggedIn ? <Login /> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/employees" element={isLoggedIn ? <EmployeeManagement /> : <Navigate to="/login" />} />
            <Route path="/courses" element={isLoggedIn ? <CourseManagement /> : <Navigate to="/login" />} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default App
