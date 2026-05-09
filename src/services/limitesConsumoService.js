import apiClient from './api';

export const limitesConsumoService = {
  getAll: (params = {}) => apiClient.get('/limites-consumo/', { params }),
  getById: (id) => apiClient.get(`/limites-consumo/${id}/`),
  create: (data) => apiClient.post('/limites-consumo/', data),
  update: (id, data) => apiClient.put(`/limites-consumo/${id}/`, data),
  delete: (id) => apiClient.delete(`/limites-consumo/${id}/`),
  validarConsumo: (data) => apiClient.post('/limites-consumo/validar_consumo/', data),
  resumenConsumo: (clienteId) => apiClient.get('/limites-consumo/resumen_consumo/', { params: { cliente_id: clienteId } }),
};

export default limitesConsumoService;
