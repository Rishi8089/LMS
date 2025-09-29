import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../App";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";
import { useAuth } from "../context/authContext.jsx"; // ✅ import auth hook

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { isLoggedIn, login } = useAuth();

  // ✅ Block login page if already logged in OR token exists
  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Token on login page:", token);
    console.log("isLoggedIn on login page:", isLoggedIn);
    if (isLoggedIn || token) {
      navigate("/");
    }
  }, [isLoggedIn, navigate]);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${serverUrl}/api/auth/login`,
        { email, password },
        { withCredentials: true }
      );

      if (response.status === 200) {
        toast.success("Login Successful");

        // ✅ Save token if backend sends one
        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
        }

        login(response.data.user); 
        navigate("/");
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="relative flex-grow flex items-center justify-center py-12 px-4 bg-center bg-cover">
        <div className="relative bg-white/80 backdrop-blur-md p-8 sm:p-10 rounded-[3rem] shadow-2xl w-full max-w-sm">
          <div className="text-center space-y-2 mb-6">
            <h2 className="text-3xl font-bold text-gray-800">Login here ..</h2>
            <div className="h-1 bg-gray-900 w-16 mx-auto rounded-full"></div>
          </div>

          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            <input
              type="email"
              placeholder="Enter Email Address..."
              className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 transition-shadow ease-in-out"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Enter Password..."
              className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 transition-shadow ease-in-out"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="submit"
              className="w-full flex items-center justify-center bg-black text-white px-8 py-3 rounded-full shadow transition-transform ease-in-out hover:scale-95"
              disabled={loading}
            >
              {loading ? <ClipLoader color="white" /> : "Login"}
            </button>
          </form>

          <div className="text-center pt-4">
            <a href="#" className="text-sm text-blue-600 hover:underline">
              Forgot password?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
