import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Tickets from './pages/tickets.jsx'
import CheckAuth from './components/check-auth.jsx'



createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
  <Routes>

    <Route path="/*" element={<CheckAuth protected = {true}>  
             <Tickets />
</CheckAuth>    
  } />
  </Routes>

    </BrowserRouter>
  </StrictMode>,
)
