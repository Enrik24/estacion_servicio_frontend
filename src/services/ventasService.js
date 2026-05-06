import apiClient from './api';

export const islasService = {
    getAll: () => apiClient.get('/islas/'),
    getOne: (id) => apiClient.get(`/islas/${id}/`),
};

export const ladosService = {
    getAll: () => apiClient.get('/lados/'),
    getPorIsla: (islaId) => apiClient.get(`/lados/?isla=${islaId}`),
};

export const tiposCombustibleService = {
    getAll: () => apiClient.get('/tipos-combustible/'),
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
export const sucursalesService = {
    getAll: () => apiClient.get('/sucursales/'),
    getOne: (id) => apiClient.get(`/sucursales/${id}/`),
    crear: (data) => apiClient.post('/sucursales/', data),
    actualizar: (id, data) => apiClient.put(`/sucursales/${id}/`, data),
    eliminar: (id) => apiClient.delete(`/sucursales/${id}/`),
};