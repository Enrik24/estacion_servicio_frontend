import apiClient from './api';

export const monitoreoService = {
    getSurtidores: () => apiClient.get('/monitoreo/surtidores/'),
    cambiarEstado: (data) => apiClient.post('/monitoreo/surtidores/cambiar_estado/', data),
    getHistorial: () => apiClient.get('/monitoreo/surtidores/historial/'),
};