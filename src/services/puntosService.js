import apiClient from './api';

export const puntosService = {
    getConfig: () => apiClient.get('/configuracion-puntos/actual/'),
    guardarConfig: (data) => apiClient.put('/configuracion-puntos/guardar/', data),

    getRanking: () => apiClient.get('/puntos/ranking/'),
    getMovimientos: (clienteId) => apiClient.get(`/puntos/cliente/${clienteId}/`),
    ajustar: (clienteId, data) => apiClient.post(`/puntos/cliente/${clienteId}/ajustar/`, data),
};

export default puntosService;
