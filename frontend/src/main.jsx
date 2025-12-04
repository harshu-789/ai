// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import { BrowserRouter, Route, Routes } from 'react-router-dom'

// import Tickets from './pages/tickets.jsx'
// import TicketDetails from './pages/ticket.jsx'
// import Login from './pages/login.jsx'
// import CheckAuth from './components/check-auth.jsx'
// import Signup from './pages/signup.jsx'
// import Admin from './pages/admin.jsx'
// import Navbar from './components/navbar.jsx'

// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <BrowserRouter>
//       <Routes>
     
//         <Route
//           path="/"
//           element={
//             <CheckAuth protectedRoute={true}>
//               <Tickets />
//             </CheckAuth>
//           }
//         />

//         <Route
//           path="/tickets/:id"
//           element={
//             <CheckAuth protected={true}>
//               <TicketDetails />
//             </CheckAuth>
//           }
//         />

//         <Route
//           path="/login"
//           element={
//             <CheckAuth protected={false}>
//               <Login />
//             </CheckAuth>
//           }
//         />

//         <Route
//           path="/signup"
//           element={
//             <CheckAuth protected={false}>
//               <Signup />
//             </CheckAuth>
//           }
//         />

//         <Route
//           path="/admin"
//           element={
//             <CheckAuth protected={true}>
//               <Admin />
//             </CheckAuth>
//           }
//         />

//       </Routes>
//     </BrowserRouter>
//   </StrictMode>
// )




import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import Tickets from './pages/tickets.jsx'
import TicketDetails from './pages/ticket.jsx'
import Login from './pages/login.jsx'
import Signup from './pages/signup.jsx'
import Admin from './pages/admin.jsx'
import CheckAuth from './components/check-auth.jsx'
import Navbar from './components/navbar.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>

      <Navbar />

      <Routes>

  {/* Default Home Route */}
  <Route path="/" element={<Login />} />

  {/* Public Routes */}
  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<Signup />} />

  {/* Protected Routes */}
  <Route
    path="/tickets"
    element={
      <CheckAuth protectedRoute>
        <Tickets />
      </CheckAuth>
    }
  />

  <Route
    path="/tickets/:id"
    element={
      <CheckAuth protectedRoute>
        <TicketDetails />
      </CheckAuth>
    }
  />

  <Route
    path="/admin"
    element={
      <CheckAuth protectedRoute role="admin">
        <Admin />
      </CheckAuth>
    }
  />
</Routes>

    </BrowserRouter>
  </StrictMode>
)
