import apiClient from './api';

/**
 * Servicio de Bitácora
 * Maneja el registro de actividad del sistema
 */
export const bitacoraService = {
  getAll: (params) => apiClient.get('/seguridad/bitacora/', { params }),
  
  getById: (id) => apiClient.get(`/seguridad/bitacora/${id}/`),
  
  // Filtrar por usuario
  getByUsuario: (usuarioId) => apiClient.get('/seguridad/bitacora/', { 
    params: { usuario: usuarioId } 
  }),
  
  // Filtrar por módulo
  getByModulo: (modulo) => apiClient.get('/seguridad/bitacora/', { 
    params: { modulo } 
  }),
  
  // Filtrar por rango de fechas
  getByDateRange: (fechaInicio, fechaFin) => apiClient.get('/seguridad/bitacora/', { 
    params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin } 
  }),
  
  // Exportar logs (si el backend lo soporta)
  exportLogs: (format = 'csv') => apiClient.get('/seguridad/bitacora/export/', { 
    params: { format },
    responseType: 'blob'
  })
};

export default bitacoraService;
