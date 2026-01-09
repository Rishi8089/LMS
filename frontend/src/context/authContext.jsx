// contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { serverUrl } from "../config.js";

// 1. Create the AuthContext
export const AuthContext = createContext({
  isLoggedIn: false,
  user: null,
  login: () => {},
  logout: () => {},
  isAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

// 2. AuthProvider Component
export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // --- Initial Auth Check ---
  useEffect(() => {
    const checkLogin = async () => {
      try {
        // Check employee auth
        const employeeRes = await axios.get(`${serverUrl}/api/auth/check`, {
          withCredentials: true,
        });

        if (employeeRes.data.loggedIn) {
          setIsLoggedIn(true);
          setUser(employeeRes.data.user || null);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // Check admin auth
        const adminRes = await axios.get(`${serverUrl}/api/admin/check`, {
          withCredentials: true,
        });

        if (adminRes.data.loggedIn) {
          setIsLoggedIn(true);
          setUser(adminRes.data.user || null);
          setIsAdmin(true);
          setLoading(false);
          return;
        }

        // Neither logged in
        setIsLoggedIn(false);
        setUser(null);
        setIsAdmin(false);
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsLoggedIn(false);
        setUser(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkLogin();
  }, []);

  // --- Check for SSO callback ---
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('sso') === 'success') {
      // SSO login successful, refresh auth state
      checkLogin();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // --- Login (set state after successful login API) ---
  const login = (userData, admin = false) => {
    // Clear any previous state first
    setUser(null);
    setIsLoggedIn(false);
    setIsAdmin(false);

    // Clear Redux store for previous user
    if (window.store) {
      window.store.dispatch({ type: 'employee/clearEmployee' });
    }

    // Then set new state
    setUser(userData);
    setIsLoggedIn(true);
    setIsAdmin(admin);
  };

  // --- Logout (clear cookie on backend + reset state) ---
  const logout = async () => {
    try {
      if (isAdmin) {
        await axios.post(`${serverUrl}/api/admin/logout`, {
          withCredentials: true,
        });
      } else {
        await axios.post(`${serverUrl}/api/auth/logout`, {
          withCredentials: true,
        });
      }

      // Reset state after successful logout
      setUser(null);
      setIsLoggedIn(false);
      setIsAdmin(false);

      // Clear all localStorage data
      localStorage.clear();

      // Clear Redux store
      if (window.store) {
        window.store.dispatch({ type: 'employee/clearEmployee' });
      }
    } catch (error) {
      console.error("Logout API call failed:", error);
      // Even if API fails, reset state and clear storage
      setUser(null);
      setIsLoggedIn(false);
      setIsAdmin(false);

      // Clear all localStorage data
      localStorage.clear();

      // Clear Redux store
      if (window.store) {
        window.store.dispatch({ type: 'employee/clearEmployee' });
      }
    }
  };

  const contextValue = {
    isLoggedIn,
    user,
    login,
    logout,
    loading,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
