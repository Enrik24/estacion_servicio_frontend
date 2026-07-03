import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminPanel from './pages/AdminPanel';
import VentasPanel from './pages/VentasPage';
import BitacoraPage from './pages/BitacoraPage';
import ReportesPage from './pages/ReportesPage';
import ProtectedRoute from './components/ProtectedRoute';
import ConsolidacionCaja from './pages/ConsolidacionCaja';
import SuperAdminPanel from './pages/SuperAdminPanel';
import GerentePanel from './pages/GerentePanel';
import MonitoreoPage from './pages/MonitoreoPage';
import InventarioPage from './pages/InventarioPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/admin/*" element={
          <ProtectedRoute rolesPermitidos={['Administrador']}>
            <AdminPanel />
          </ProtectedRoute>
        } />
        <Route path="/admin/consolidacion" element={
          <ProtectedRoute rolesPermitidos={['Administrador', 'Gerente']}>
            <ConsolidacionCaja />
          </ProtectedRoute>
        } />
        // Agrega ruta de gerente
        <Route path="/gerente/*" element={
          <ProtectedRoute rolesPermitidos={['Gerente']}>
            <GerentePanel />
          </ProtectedRoute>
        } />

        <Route path="/gerente/consolidacion" element={
          <ProtectedRoute rolesPermitidos={['Gerente']}>
            <ConsolidacionCaja />
          </ProtectedRoute>
        } />
        <Route path="/ventas/*" element={
          <ProtectedRoute rolesPermitidos={['Administrador', 'Operador']}>
            <VentasPanel />
          </ProtectedRoute>
        } />
        <Route path="/bitacora" element={
          <ProtectedRoute rolesPermitidos={['Administrador', 'Auditor', 'Gerente']}>
            <BitacoraPage />
          </ProtectedRoute>
        } />

        <Route path="/reportes" element={
          <ProtectedRoute rolesPermitidos={['Administrador', 'Gerente', 'Auditor']}>
            <ReportesPage />
          </ProtectedRoute>
        } />
        <Route path="/superadmin" element={
          <ProtectedRoute soloSuperAdmin={true}>
            <SuperAdminPanel />
          </ProtectedRoute>
        } />
        <Route path="/monitoreo" element={
          <ProtectedRoute rolesPermitidos={['Administrador', 'Gerente']}>
            <MonitoreoPage />
          </ProtectedRoute>
        } />
        <Route path="/inventario/tanques" element={
    <ProtectedRoute rolesPermitidos={['Administrador', 'Gerente']}>
        <InventarioPage />
    </ProtectedRoute>
} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;