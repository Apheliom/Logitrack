import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminAnalyticsPage } from './pages/AdminAnalyticsPage';
import { AdminDriversPage } from './pages/AdminDriversPage';
import { DriverView } from './pages/DriverView';
import { CustomerStorePage } from './pages/CustomerStorePage';
import { ClientOrdersPage } from './pages/ClientOrdersPage';
import { PublicTrackingPage } from './pages/PublicTrackingPage';

// Componente para Proteger Rutas
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span>Iniciando sesión segura...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirección inteligente al área propia del rol
    if (user.role === 'DRIVER') return <Navigate to="/driver" replace />;
    if (user.role === 'CLIENT') return <Navigate to="/store" replace />;
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Rutas Públicas */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/track/:trackingNumber?" element={<PublicTrackingPage />} />

                {/* Rutas para Clientes */}
                <Route path="/store" element={<CustomerStorePage />} />
                <Route
                  path="/client/my-orders"
                  element={
                    <ProtectedRoute allowedRoles={['CLIENT', 'ADMIN']}>
                      <ClientOrdersPage />
                    </ProtectedRoute>
                  }
                />

                {/* Rutas para Repartidores */}
                <Route
                  path="/driver"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'DRIVER']}>
                      <DriverView />
                    </ProtectedRoute>
                  }
                />

                {/* Rutas para Administradores / Despacho */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/analytics"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminAnalyticsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/drivers"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDriversPage />
                    </ProtectedRoute>
                  }
                />

                {/* Ruta por Defecto */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </main>
          </div>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
