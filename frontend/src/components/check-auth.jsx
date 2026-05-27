import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function CheckAuth({ children, protectedRoute = false, role }) {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const user = getStoredUser();

  useEffect(() => {
    if (protectedRoute && !token) {
      navigate(`/login?redirect=${location.pathname}`, { replace: true });
      return;
    }

    if (role && user?.role !== role) {
      navigate("/login", { replace: true });
    }
  }, [location.pathname, navigate, protectedRoute, role, token, user?.role]);

  if (protectedRoute && !token) return <p>Loading...</p>;
  if (role && user?.role !== role) return <p>Loading...</p>;

  return children;
}

export default CheckAuth;
