import { useEffect, useState } from 'react';
import AccessDeniedModal from './common/AccessDeniedModal';

/**
 * Componente global para mostrar modales de acceso denegado (403)
 * Escucha eventos 'access-denied' disparados por el interceptor de api.js
 */
function GlobalErrorHandler() {
  const [show403Modal, setShow403Modal] = useState(false);

  useEffect(() => {
    const handleAccessDenied = (event) => {
      console.warn('Acceso denegado:', event.detail);
      setShow403Modal(true);
    };

    window.addEventListener('access-denied', handleAccessDenied);

    return () => {
      window.removeEventListener('access-denied', handleAccessDenied);
    };
  }, []);

  return (
    <AccessDeniedModal 
      isOpen={show403Modal}
      onClose={() => setShow403Modal(false)}
      titulo="Acceso Denegado"
    />
  );
}

export default GlobalErrorHandler;
