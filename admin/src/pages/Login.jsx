import React, { useState, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/authContext.jsx';
import { serverUrl } from '../config.js';
import { useNavigate } from "react-router-dom";
import {ClipLoader} from 'react-spinners'

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${serverUrl}/api/admin/login`, { email, password }, { withCredentials: true });
      toast.success(res.data.message);
      login(res.data.user);
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
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
            onSubmit={handleSubmit}
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
              className="w-full flex items-center justify-center bg-black text-white px-8 py-3 rounded-full shadow transition-transform ease-in-out hover:scale-95 cursor-pointer"
              disabled={loading}
              
            >
              {loading ? <ClipLoader color="white" /> : "Login"}
            </button>
          </form>

          
        </div>
      </div>
    </div>
  );
};

export default Login;
