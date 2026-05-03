import apiClient from './api';

/**
 * Servicio de Usuarios
 * Maneja CRUD de usuarios y asignación de roles
 */
export const usuariosService = {
  getAll: () => apiClient.get('/usuarios/'),
  
  getById: (id) => apiClient.get(`/usuarios/${id}/`),
  
  create: (data) => apiClient.post('/usuarios/', data),
  
  update: (id, data) => apiClient.put(`/usuarios/${id}/`, data),
  
  delete: (id) => apiClient.delete(`/usuarios/${id}/`),
  
  asignarRoles: (id, roles) => apiClient.post(`/usuarios/${id}/asignar-roles/`, { roles }),
  
  // Cambiar estado activo/inactivo
  toggleStatus: (id, isActive) => apiClient.patch(`/usuarios/${id}/`, { is_active: isActive }),
  
  // Cambiar contraseña
  changePassword: (id, passwordData) => apiClient.post(`/usuarios/${id}/change-password/`, passwordData)
};

export default usuariosService;
