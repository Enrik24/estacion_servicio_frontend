import { useAuthContext } from '../context/AuthContext';

/**
 * Hook para validar un permiso específico
 * @param {string} codigoPermiso - El código del permiso a validar (ej: 'usuarios.crear')
 * @returns {boolean} - true si el usuario tiene el permiso, false en caso contrario
 */
export const usePermiso = (codigoPermiso) => {
  const { user } = useAuthContext();
  
  if (!user || !user.roles) {
    return false;
  }

  // Buscar el permiso en los roles del usuario
  return user.roles.some(rol => {
    // Verificar en permisos_detalle (nuevo formato)
    if (rol.permisos_detalle && Array.isArray(rol.permisos_detalle)) {
      return rol.permisos_detalle.some(p => p.codigo === codigoPermiso);
    }
    
    // Fallback a permisos (old format - array de IDs)
    if (rol.permisos && Array.isArray(rol.permisos)) {
      // Si permisos contiene objetos en lugar de IDs
      return rol.permisos.some(p => 
        (typeof p === 'object' && p.codigo === codigoPermiso) ||
        (typeof p === 'number') // Si es array de IDs, no podemos comparar directamente
      );
    }
    
    return false;
  });
};

/**
 * Hook para validar si el usuario puede acceder al panel de administración
 * @returns {boolean} - true si puede acceder al panel admin
 */
export const usePuedeAccederAdmin = () => {
  const { user } = useAuthContext();
  
  if (!user || !user.roles || !Array.isArray(user.roles)) {
    return false;
  }

  let tieneRolAdmin = false;
  for (const rol of user.roles) {
    const rolNombre = (rol.nombre || '').toLowerCase().trim();
    if (rolNombre === 'administrador') {
      tieneRolAdmin = true;
      break;
    }
  }

  if (tieneRolAdmin) {
    return true;
  }

  for (const rol of user.roles) {
    if (rol.permisos_detalle && Array.isArray(rol.permisos_detalle)) {
      const tienePermiso = rol.permisos_detalle.some(p => p.codigo === 'admin.acceso');
      if (tienePermiso) {
        return true;
      }
    }
    
    if (rol.permisos && Array.isArray(rol.permisos)) {
      const tienePermiso = rol.permisos.some(p => 
        (typeof p === 'object' && p.codigo === 'admin.acceso')
      );
      if (tienePermiso) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Hook para obtener todos los permisos disponibles para el usuario
 * @returns {Set<string>} - Set de todos los códigos de permiso disponibles
 */
export const usePermisos = () => {
  const { user } = useAuthContext();
  const permisos = new Set();

  if (user && user.roles && Array.isArray(user.roles)) {
    for (const rol of user.roles) {
      // Verificar en permisos_detalle (nuevo formato)
      if (rol.permisos_detalle && Array.isArray(rol.permisos_detalle)) {
        rol.permisos_detalle.forEach(p => {
          if (p.codigo) {
            permisos.add(p.codigo);
          }
        });
      }
      
      // Fallback a permisos (old format)
      if (rol.permisos && Array.isArray(rol.permisos)) {
        rol.permisos.forEach(p => {
          if (typeof p === 'object' && p.codigo) {
            permisos.add(p.codigo);
          }
        });
      }
    }
  }

  return permisos;
};
