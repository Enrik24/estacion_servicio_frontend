import apiClient from './api';

const consolidacionService = {
  // Obtiene indicadores y tabla
  getResumen: async () => {
    const response = await apiClient.get('/consolidacion/');
    return response.data;
  },
  // Ejecuta la acción de consolidar
  consolidarTurno: async (id) => {
    const response = await apiClient.post(`/consolidacion/${id}/consolidar/`);
    return response.data;
  }
};

export default consolidacionService;