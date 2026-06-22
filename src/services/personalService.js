import apiClient from './api';

export const personalService = {
    getAll: () => apiClient.get('/usuarios/'),
    getOne: (id) => apiClient.get(`/usuarios/${id}/`),
    crear: (data) => apiClient.post('/usuarios/', data),
    editar: (id, data) => apiClient.patch(`/usuarios/${id}/`, data),
    desactivar: (id) => apiClient.delete(`/usuarios/${id}/`),
    asignarRoles: (id, roles) => apiClient.post(`/usuarios/${id}/asignar-roles/`, { roles }),
    getRoles: () => apiClient.get('/roles/'),
    getTurnos: (fecha) => apiClient.get(`/turnos/resumen/?fecha=${fecha}`),
    getIslas: () => apiClient.get('/islas/'),
    abrirTurno: (data) => apiClient.post('/turnos/', data),
    cerrarTurno: (id, data) => apiClient.post(`/turnos/${id}/cerrar/`, data),
};