import apiClient from './api';


export const clientesService = {
  getAll: (params = {}) => apiClient.get('/clientes/', { params }),
  getById: (id) => apiClient.get(`/clientes/${id}/`),
  create: (data) => apiClient.post('/clientes/', data),
  update: (id, data) => apiClient.put(`/clientes/${id}/`, data),
  delete: (id) => apiClient.delete(`/clientes/${id}/`),
  completarPerfil: (data) => apiClient.put('/perfil/completar/', data), // mantengo por retrocompatibilidad
  getProfile: () => apiClient.get('/usuarios/me/'),
  updateProfile: (data) => apiClient.patch('/usuarios/me/', data),
};

export default clientesService;
