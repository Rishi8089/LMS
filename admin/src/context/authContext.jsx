import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { serverUrl } from "../config.js";

// 1. Create the AuthContext
export const AuthContext = createContext({
  isLoggedIn: false,
  user: null,
  login: () => {},
  logout: () => {},
});

// 2. AuthProvider Component
export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Initial Auth Check ---
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const res = await axios.get(`${serverUrl}/api/admin/check`, {
          withCredentials: true,
        });

        if (res.data.loggedIn) {
          setIsLoggedIn(true);
          setUser(res.data.user || null);
        } else {
          setIsLoggedIn(false);
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkLogin();
  }, []);

  // --- Login (set state after successful login API) ---
  const login = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
  };

  // --- Logout (clear cookie on backend + reset state) ---
  const logout = async () => {
    try {
      await axios.post(`${serverUrl}/api/admin/logout`, {
        withCredentials: true,
      });
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      setUser(null);
      setIsLoggedIn(false);
    }
  };

  const contextValue = {
    isLoggedIn,
    user,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
