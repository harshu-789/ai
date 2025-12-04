// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';

// function CheckAuth({ children, protectedRoute }) {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const token = localStorage.getItem("token");

//     if (protectedRoute) {
//       if (!token) {
//         setLoading(false);
//         setTimeout(() => navigate("/signup"), 0);
//       } else {
//         setLoading(false);
//       }
//     } else {
//       if (token) {
//         setLoading(false);
//         setTimeout(() => navigate("/login"), 0);
//       } else {
//         setLoading(false);
//       }
//     }
//   }, [navigate, protectedRoute]);

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   return children;
// }

// export default CheckAuth;


import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function CheckAuth({ children, protectedRoute = false, role }) {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");

    // If route is protected & no token → redirect
    if (protectedRoute && !token) {
      navigate("/login?redirect=" + location.pathname, { replace: true });
      return;
    }

    // If route requires a specific role
    if (role && storedRole !== role) {
      navigate("/login", { replace: true });
      return;
    }

    setLoading(false);
  }, []);

  if (loading) return <p>Loading...</p>;

  return children;
}

export default CheckAuth;
