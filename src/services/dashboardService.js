import apiClient from './api';

export const dashboardService = {
  /**
   * Obtiene todos los KPIs del dashboard ejecutivo.
   * El backend filtra automáticamente por rol:
   * - Administrador: ve datos consolidados de todas las sucursales
   * - Gerente: ve solo datos de su sucursal asignada
   *
   * @param {string|null} fechaInicio - Fecha inicio en formato YYYY-MM-DD
   * @param {string|null} fechaFin - Fecha fin en formato YYYY-MM-DD
   * @returns {Promise} Respuesta con los KPIs del dashboard
   */
  getKPIs: (fechaInicio = null, fechaFin = null) => {
    const params = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    return apiClient.get('/dashboard/kpis/', { params });
  },
};
