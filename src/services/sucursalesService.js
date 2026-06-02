import apiClient from './api';

export const sucursalesService = {
    getAll: () => apiClient.get('/sucursales/'),
    getOne: (id) => apiClient.get(`/sucursales/${id}/`),
    crear: (data) => apiClient.post('/sucursales/', data),
    actualizar: (id, data) => apiClient.put(`/sucursales/${id}/`, data),
    eliminar: (id) => apiClient.delete(`/sucursales/${id}/`),
};