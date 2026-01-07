import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/authContext.jsx";

const PublicRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();

  if (loading) return null; // wait until auth check finishes

  // ✅ If user is already logged in, prevent access to public routes
  if (isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PublicRoute;
