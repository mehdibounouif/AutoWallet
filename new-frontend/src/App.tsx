import { useState } from 'react';
import Sidebar from './components/SideBar/SideBar';
import Assistant from './components/assistant/Assistant';
import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/Layout/DashboardLayout';
import ComingSoon from './pages/ComingSoon';

function App() {
  const [count, setCount] = useState(0)

  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path='/home' element={<ComingSoon name="Home" />}/>
        <Route path='/envelopes' element={<ComingSoon name="envlopes" />}/>
        <Route path='/rules' element={<ComingSoon name="rules" />}/>
        <Route path='/activity' element={<ComingSoon name="activity" />}/>
        <Route path='/analytics' element={<ComingSoon name="analytics" />}/>
        <Route path='/assistant' element={<Assistant />}/>
        <Route path='/settings' element={<ComingSoon name="settings" />}/>
      </Route>
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

export default App
