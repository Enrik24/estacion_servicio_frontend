import apiClient from './api';

export const puntosService = {
    getConfig: () => apiClient.get('/configuracion-puntos/actual/'),
    guardarConfig: (data) => apiClient.put('/configuracion-puntos/guardar/', data),

    getRanking: () => apiClient.get('/clientes/ranking_puntos/'),
    getMovimientos: (clienteId) => apiClient.get(`/clientes/${clienteId}/puntos/`),
    ajustar: (clienteId, data) => apiClient.post(`/clientes/${clienteId}/ajustar_puntos/`, data),
};

export default puntosService;
