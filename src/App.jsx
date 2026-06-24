import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Inquiry from './pages/Inquiry';
import OrderTracking from './pages/OrderTracking';
import AdminPanel from './pages/AdminPanel';
import Auth from './pages/Auth'; 
import UserProfile from './pages/UserProfile'; // 🎯 YENİ EKLENDİ: Profil sayfası dahil edildi
import { AuthContext } from './context/AuthContext'; 

// 🛡️ KORUYUCU WRAPPER COMPONENT (PROTECTED ROUTE)
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user } = useContext(AuthContext);

  // 1. Durum: Kullanıcı hiç giriş yapmadıysa direkt giriş sayfasına yönlendir
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // 2. Durum: Admin rolü gerekirken kullanıcının rolü ADMIN değilse anasayfaya şutla
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // Her şey yolundaysa gitmek istediği sayfayı aç kanka
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Herkese Açık Rota */}
        <Route path="/" element={<Inquiry />} />
        <Route path="/auth" element={<Auth />} /> 

        {/* 🔐 Giriş Zorunlu Rota (Sipariş Takip) */}
        <Route 
          path="/track/:orderId" 
          element={
            <ProtectedRoute>
              <OrderTracking />
            </ProtectedRoute>
          } 
        />

        {/* 🔐 🎯 YENİ EKLENDİ: Giriş Zorunlu Rota (Müşteri Profil Ayarları) */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          } 
        />

        {/* 🔐 Sadece ADMIN'e Açık Korumalı Rota (Yönetim Paneli) */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminPanel />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;