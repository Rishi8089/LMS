import React from "react";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../context/authContext.jsx";

const Header = () => {
  const navigate = useNavigate();
  const { logout, isLoggedIn } = useContext(AuthContext);

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
    <div>
      <div className="top-0 left-0 w-full h-16 bg-white shadow-md border-b flex items-center justify-between px-6 sm:px-20 z-50">
        {/* Left - Logo */}
        <div
          className="text-xl font-bold text-black cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          Strategy Boolean
        </div>

        {/*Right - Logout button*/}
         {isLoggedIn && (<div>
          <button
            className="cursor-pointer flex items-center gap-2 bg-black text-white px-4 py-2 rounded-3xl shadow
                       transition ease-in-out hover:scale-95"
                       onClick={handleLogout}
          >
            Log out
          </button>
        </div>) }
        
      </div>
    </div>
  );
};

export default Header;
