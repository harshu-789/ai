// import { Link } from "react-router-dom";
// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";



// export default function Navbar() {
//    const [token, setToken] = useState(localStorage.getItem("token")|| null);
//    const [user, setUser] =useState(localStorage.getItem("user")
//       ? JSON.parse(localStorage.getItem("user"))
//       : null)
//         const navigate = useNavigate();

//   useEffect(() => {
//      // This effect runs when localStorage changes in *other windows*
//      const onStorage = () => setToken(localStorage.getItem("token"));
//      window.addEventListener("storage", onStorage);
//      return () => window.removeEventListener("storage", onStorage);
//   }, []);

//   const logout = () => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("user");
//      setToken(null);  
//     navigate("/login");
//   };
//   return (
//     <div className="navbar bg-base-200">
//       <div className="flex-1">
//         <Link to="/" className="btn btn-ghost text-xl">
//           Ticket AI
//         </Link>
//       </div>
//       <div className="flex gap-2">
//         {!token ? (
//           <>
//             <Link to="/signup" className="btn btn-sm">
//               Signup
//             </Link>
//             <Link to="/login" className="btn btn-sm">
//               Login
//             </Link>
//           </>
//         ) : (
//           <>
//             <p>Hi, {user?.email}</p>
//             {user && user?.role === "admin" ? (
//               <Link to="/admin" className="btn btn-sm">
//                 Admin
//               </Link>
//             ) : null}
//             <button onClick={logout} className="btn btn-sm">
//               Logout
//             </button>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }



import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(
    localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user"))
      : null
  );

  const navigate = useNavigate();

  // Listen to login/logout triggers
  useEffect(() => {
    const updateAuth = () => {
      setToken(localStorage.getItem("token"));
      setUser(
        localStorage.getItem("user")
          ? JSON.parse(localStorage.getItem("user"))
          : null
      );
    };

    window.addEventListener("storage", updateAuth);
    return () => window.removeEventListener("storage", updateAuth);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Trigger Navbar to re-render
    window.dispatchEvent(new Event("storage"));
    navigate("/login");
  };

  return (
    <div className="navbar bg-base-200">
      <div className="flex-1">
        <Link to="/" className="btn btn-ghost text-xl">
          Ticket AI
        </Link>
      </div>
      <div className="flex gap-2">
        {!token ? (
          <>
            <Link to="/signup" className="btn btn-sm">Signup</Link>
            <Link to="/login" className="btn btn-sm">Login</Link>
          </>
        ) : (
          <>
            <p>Hi, {user?.email}</p>
            {user?.role === "admin" && (
              <Link to="/admin" className="btn btn-sm">Admin</Link>
            )}
            <button onClick={logout} className="btn btn-sm">Logout</button>
          </>
        )}
      </div>
    </div>
  );
}
