import apiClient from './api';

/**
 * Servicio de Permisos
 * Maneja CRUD de permisos del sistema
 */
export const permisosService = {
  getAll: () => apiClient.get('/permisos/'),
  
  getById: (id) => apiClient.get(`/permisos/${id}/`),
  
  create: (data) => apiClient.post('/permisos/', data),
  
  update: (id, data) => apiClient.put(`/permisos/${id}/`, data),
  
  delete: (id) => apiClient.delete(`/permisos/${id}/`),
  
  // Obtener permisos agrupados por módulo
  getGroupedByModule: async () => {
    const response = await apiClient.get('/permisos/');
    const perms = Array.isArray(response.data) ? response.data : response.data.results || [];
    
    return perms.reduce((acc, perm) => {
      const modulo = perm.modulo || 'General';
      if (!acc[modulo]) acc[modulo] = [];
      acc[modulo].push(perm);
      return acc;
    }, {});
  }
};

export default permisosService;
