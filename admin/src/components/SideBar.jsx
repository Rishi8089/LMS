import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../context/authContext.jsx";

const SideBar = () => {
  const navigate = useNavigate();
  const { logout, isLoggedIn } = useContext(AuthContext);

  if (!isLoggedIn) return null; // ✅ If not logged in, don't render sidebar

  return (
    <div className="h-screen w-64 border bg-white p-6 flex flex-col shadow-md">
      <ul className="space-y-8 text-gray-700 font-bold ">
        <li
          className="cursor-pointer hover:text-amber-600 transition"
          onClick={() => navigate("/dashboard")}
        >
          Admin Dashboard
        </li>
        <li
          className="cursor-pointer hover:text-amber-600 transition"
          onClick={() => navigate("/employees")}
        >
          Employee Management
        </li>
        <li
          className="cursor-pointer hover:text-amber-600 transition"
          onClick={() => navigate("/courses")}
        >
          Course Management
        </li>
        
      </ul>
    </div>
  );
};

export default SideBar;
