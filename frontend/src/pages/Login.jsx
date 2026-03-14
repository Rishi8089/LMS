import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../config.js";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";
import { useAuth } from "../context/authContext.jsx";
import getCurrentEmployee from "../customHook/getCurrentEmployee.js";
import { FaMicrosoft } from "react-icons/fa";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { isLoggedIn, login } = useAuth();
  const employee = getCurrentEmployee();

  useEffect(() => {
    if (isLoggedIn) navigate("/");
  }, [isLoggedIn, navigate]);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      let response = await axios.post(
        `${serverUrl}/api/auth/login`,
        { email, password },
        { withCredentials: true }
      );

      if (response.status === 200) {
        toast.success("Login Successful");
        if (response.data.user) login(response.data.user, false);
        navigate("/");
        return;
      }
    } catch {
      try {
        const response = await axios.post(
          `${serverUrl}/api/admin/login`,
          { email, password },
          { withCredentials: true }
        );

        if (response.status === 200) {
          toast.success("Login Successful");
          if (response.data.user) login(response.data.user, true);
          navigate("/");
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div
        className="relative w-full max-w-md rounded-[2.5rem]
        bg-white/90 backdrop-blur-xl
        border border-orange-100
        shadow-[0_20px_40px_rgba(0,0,0,0.06)]
        p-8 sm:p-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-black">
            Welcome Back
          </h2>
          <p className="text-sm text-gray-700 mt-1">
            Login to continue learning
          </p>

          <div className="h-1 w-20 mx-auto mt-4 rounded-full
            bg-gradient-to-r from-orange-400 to-orange-600" />
        </div>

        {/* Form */}
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          <input
            type="email"
            placeholder="Email address"
            className="w-full px-5 py-4 rounded-xl border border-orange-100
              focus:outline-none focus:ring-2 focus:ring-orange-300
              bg-white text-black placeholder-gray-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full px-5 py-4 rounded-xl border border-orange-100
              focus:outline-none focus:ring-2 focus:ring-orange-300
              bg-white text-black placeholder-gray-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center
              rounded-full px-8 py-3 font-semibold
              bg-gradient-to-r from-orange-500 to-orange-600
              text-white shadow-md
              hover:scale-[0.97] transition-transform cursor-pointer"
          >
            {loading ? <ClipLoader color="white" size={20} /> : "Login"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-orange-100"></div>
          <span className="px-3 text-sm text-gray-600">or</span>
          <div className="flex-1 border-t border-orange-100"></div>
        </div>

        {/* Microsoft Login */}
        <button
          onClick={() =>
            (window.location.href = `${serverUrl}/api/auth/microsoft`)
          }
          className="w-full flex items-center justify-center gap-3
            rounded-full px-8 py-3 border border-gray-300
            bg-white text-black shadow-sm
            hover:bg-gray-50 transition cursor-pointer"
        >
          <FaMicrosoft className="text-xl text-blue-600" />
          Continue with Microsoft
        </button>

        {/* Forgot */}
        {/* <div className="text-center mt-5">
          <a href="#" className="text-sm text-black hover:underline">
            Forgot password?
          </a>
        </div> */}
      </div>
    </div>
  );
};

export default LoginPage;
