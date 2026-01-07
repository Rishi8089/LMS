import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/authContext.jsx";

const SideBar = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useContext(AuthContext);

  if (!isLoggedIn) return null;

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-orange-100
      px-6 py-8 shadow-[2px_0_20px_rgba(0,0,0,0.04)]">

      {/* Title */}
      <h2 className="text-lg font-extrabold text-black mb-8 tracking-tight">
        Admin Panel
        <div className="mt-2 h-1 w-14 rounded-full
          bg-gradient-to-r from-orange-400 to-orange-600" />
      </h2>

      {/* Navigation */}
      <ul className="space-y-3 text-sm font-semibold text-gray-700">
        <li
          onClick={() => navigate("/dashboard")}
          className="cursor-pointer px-4 py-3 rounded-xl
            hover:bg-orange-50 hover:text-orange-600
            transition-all"
        >
          Admin Dashboard
        </li>

        <li
          onClick={() => navigate("/employees")}
          className="cursor-pointer px-4 py-3 rounded-xl
            hover:bg-orange-50 hover:text-orange-600
            transition-all"
        >
          Employee Management
        </li>

        <li
          onClick={() => navigate("/courses")}
          className="cursor-pointer px-4 py-3 rounded-xl
            hover:bg-orange-50 hover:text-orange-600
            transition-all"
        >
          Course Management
        </li>
      </ul>
    </aside>
  );
};

export default SideBar;
