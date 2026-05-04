// src/services/bitacoraService.js
import apiClient from '../services/api';

export const bitacoraService = {
  // Solo lógica de red, nada de HTML
  getAll: (params) => apiClient.get('/seguridad/bitacora/', { params }),
  
  getById: (id) => apiClient.get(`/seguridad/bitacora/${id}/`),
  
  getByDateRange: (fechaInicio, fechaFin) => apiClient.get('/seguridad/bitacora/', { 
    params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin } 
  })
};

export default bitacoraService;