import apiClient from './api';

/**
 * Construye los query params a partir de un objeto de filtros,
 * eliminando los valores vacíos o nulos.
 */
const buildParams = (filtros = {}) => {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
            params.append(key, value);
        }
    });
    const qs = params.toString();
    return qs ? `?${qs}` : '';
};

export const reportesService = {
    getVentas: (filtros) => {
        const url = `/reportes/ventas/${buildParams(filtros)}`;
        console.log('[ReportesService] Solicitando Ventas:', url);
        return apiClient.get(url);
    },
    getTurnos: (filtros) => {
        const url = `/reportes/turnos/${buildParams(filtros)}`;
        console.log('[ReportesService] Solicitando Turnos:', url);
        return apiClient.get(url);
    },
    getClientes: (filtros) => {
        const url = `/reportes/clientes/${buildParams(filtros)}`;
        console.log('[ReportesService] Solicitando Clientes:', url);
        return apiClient.get(url);
    },
    getSucursales: (filtros) => {
        const url = `/reportes/sucursales/${buildParams(filtros)}`;
        console.log('[ReportesService] Solicitando Sucursales:', url);
        return apiClient.get(url);
    },
    getIslas: (filtros) => {
        const url = `/reportes/islas/${buildParams(filtros)}`;
        console.log('[ReportesService] Solicitando Islas:', url);
        return apiClient.get(url);
    },
    sendEmail: (data) => {
        console.log('[ReportesService] Enviando email:', data);
        return apiClient.post('/reportes/email/', data);
    }
};
