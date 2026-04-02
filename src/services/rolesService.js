import apiClient from './api';

/**
 * Servicio de Roles
 * Maneja CRUD de roles y gestión de permisos asociados
 */
export const rolesService = {
  getAll: () => apiClient.get('/roles/'),
  
  getById: (id) => apiClient.get(`/roles/${id}/`),
  
  create: (data) => apiClient.post('/roles/', data),
  
  update: (id, data) => apiClient.put(`/roles/${id}/`, data),
  
  delete: (id) => apiClient.delete(`/roles/${id}/`),
  
  // Obtener permisos de un rol
  getPermisos: (id) => apiClient.get(`/roles/${id}/permisos/`),
  
  // Asignar permisos a un rol
  assignPermisos: (id, permisos) => apiClient.post(`/roles/${id}/assign-permisos/`, { permisos })
};

export default rolesService;
