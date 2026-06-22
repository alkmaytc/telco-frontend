import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Inquiry from './pages/Inquiry';
import OrderTracking from './pages/OrderTracking';
import AdminPanel from './pages/AdminPanel';
import Auth from './pages/Auth'; // 🎯 Yeni Auth sayfamızı içeri aldık

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Inquiry />} />
        <Route path="/track/:orderId" element={<OrderTracking />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/auth" element={<Auth />} /> {/* 🎯 Yeni Rota Buraya Eklendi */}
      </Routes>
    </Router>
  );
}

export default App;