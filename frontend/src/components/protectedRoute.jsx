import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/authContext.jsx";

const PrivateRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();

  if (loading) return <p>Loading...</p>;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
};

export default PrivateRoute;
