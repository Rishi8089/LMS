import React, { useState, useRef, useEffect } from "react";
import { CgProfile } from "react-icons/cg";
import { IoIosLogOut } from "react-icons/io";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/authContext.jsx";
import getCurrentEmployee from "../customHook/getCurrentEmployee.js"; // ✅ use hook

const Navbar = () => {
  // ✅ Get global auth state from context
  const { logout, user, isLoggedIn } = useAuth();

  const employee = getCurrentEmployee(isLoggedIn); // ✅ fetch + subscribe to redux employee

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // ✅ Toggle dropdown
  const toggleDropdown = () => setIsOpen((prev) => !prev);

  // ✅ Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Logout handler  
  const handleLogout = async () => {
    try {
      // ✅ CORRECTED: Await the async function to ensure the API call completes
      // and the state/cookies are cleared BEFORE navigating.
      await logout(); 
      
      // These lines only run AFTER the cookies are cleared successfully
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      // This block runs if the network call or the clearing process fails
      console.error("Logout failed:", error);
      toast.error("Logout failed. Please try again.");
    }
};

  return (
    <div className="top-0 left-0 w-full h-16 bg-white shadow-md border-b flex items-center justify-between px-6 sm:px-20 z-50">
      {/* Left - Logo */}
      <div
        className="text-xl font-bold text-black cursor-pointer"
        onClick={() => navigate("/")}
      >
        Strategy Boolean
      </div>

      {/* Center - Links (only when employee is available) */}
      {employee && (
        <nav>
          <ul className="flex space-x-8 text-gray-700 font-medium">
            <li>
              <Link
                to="/"
                className="relative text-gray-700 hover:text-black transition-colors duration-300
                  after:content-[''] after:absolute after:left-0 after:-bottom-1
                  after:h-0.5 after:w-full after:scale-x-0 after:bg-black after:origin-left
                  hover:after:scale-x-100 after:transition-transform after:duration-300"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/mylearning"
                className="relative text-gray-700 hover:text-black transition-colors duration-300
                  after:content-[''] after:absolute after:left-0 after:-bottom-1
                  after:h-0.5 after:w-full after:scale-x-0 after:bg-black after:origin-left
                  hover:after:scale-x-100 after:transition-transform after:duration-300"
              >
                My Learnings
              </Link>
            </li>
          </ul>
        </nav>
      )}

      {/* Right - Profile Button */}
      {employee && (
        <div className="relative" ref={dropdownRef}>
          <button
            className="cursor-pointer flex items-center gap-2 bg-black text-white px-4 py-2 rounded-3xl shadow 
                       transition ease-in-out hover:scale-95"
            onClick={toggleDropdown}
          >
            <CgProfile className="h-5 w-5" />
            <span>{employee?.name || user?.name || "Profile"}</span>
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-44 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                {/* Profile Item */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate("/profile");
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <CgProfile className="w-5 h-5" />
                  Profile
                </button>

                {/* Logout Item */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 hover:text-red-800"
                >
                  <IoIosLogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Navbar;
