import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPanel from './pages/AdminPanel';
import VentasPanel from './pages/VentasPage';
import BitacoraPage from './pages/BitacoraPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin/*" element={
          <ProtectedRoute rolesPermitidos={['Administrador', 'Gerente']}>
            <AdminPanel />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;