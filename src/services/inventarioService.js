import apiClient from './api';

export const inventarioService = {
    getTanques: () => apiClient.get('/inventario/tanques/'),
    getSucursales: () => apiClient.get('/sucursales/'),
    getTiposCombustible: () => apiClient.get('/tipos-combustible/'),
    crearTanque: (data) => apiClient.post('/inventario/tanques/', data),
    registrarDescarga: (id, data) => apiClient.post(`/inventario/tanques/${id}/registrar_descarga/`, data),
    ampliarCapacidad: (id, data) => apiClient.patch(`/inventario/tanques/${id}/ampliar_capacidad/`, data),
    getDescargas: () => apiClient.get('/inventario/descargas/'),
};