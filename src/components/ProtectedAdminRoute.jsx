import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { usePuedeAccederAdmin } from '../hooks/usePermiso';
import AccessDeniedModal from './common/AccessDeniedModal';

/**
 * Componente para proteger rutas que requieren permiso de admin
 * Redirige a login si no está autenticado
 * Muestra modal de acceso denegado si está autenticado pero sin permisos
 */
function ProtectedAdminRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuthContext();
  const puedeAccederAdmin = usePuedeAccederAdmin();
  const navigate = useNavigate();
  const [showAccessDenied, setShowAccessDenied] = useState(true);

  console.log('[ProtectedAdminRoute] Rendering...');
  console.log('[ProtectedAdminRoute] isAuthenticated:', isAuthenticated);
  console.log('[ProtectedAdminRoute] loading:', loading);
  console.log('[ProtectedAdminRoute] user:', user);
  console.log('[ProtectedAdminRoute] puedeAccederAdmin:', puedeAccederAdmin);

  // Mientras se carga la autenticación
  if (loading) {
    console.log('[ProtectedAdminRoute] Mostrando loader...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  // No autenticado - redirigir a login
  if (!isAuthenticated) {
    console.log('[ProtectedAdminRoute] No autenticado - redirigiendo a login');
    navigate('/login', { replace: true });
    return null;
  }

  // Autenticado pero sin permisos
  if (!puedeAccederAdmin) {
    console.log('[ProtectedAdminRoute] Autenticado pero sin permisos - mostrando modal');
    return (
      <>
        <AccessDeniedModal 
          isOpen={showAccessDenied}
          onClose={() => {
            setShowAccessDenied(false);
            navigate('/', { replace: true });
          }}
          titulo="Acceso al Panel Admin Denegado"
        />
      </>
    );
  }

  // Autenticado y con permisos
  console.log('[ProtectedAdminRoute] Autenticado y con permisos - renderizando contenido');
  return children;
}

export default ProtectedAdminRoute;
