import apiClient from './api';

export const surtidoresService = {
    getAll: () => apiClient.get('/surtidores/'),
    getOne: (id) => apiClient.get(`/surtidores/${id}/`),
};

export const turnosService = {
    getAll: () => apiClient.get('/turnos/'),
    getMiTurno: () => apiClient.get('/turnos/mi_turno/'),
    abrir: (data) => apiClient.post('/turnos/', data),
    cerrar: (id, data) => apiClient.post(`/turnos/${id}/cerrar/`, data),
};

export const clientesService = {
    getAll: () => apiClient.get('/clientes/'),
    getOne: (id) => apiClient.get(`/clientes/${id}/`),
};

export const ventasService = {
    getAll: () => apiClient.get('/ventas/'),
    getMiTurnoVentas: () => apiClient.get('/ventas/mi_turno_ventas/'),
    registrar: (data) => apiClient.post('/ventas/', data),
    anular: (id) => apiClient.post(`/ventas/${id}/anular/`),
};