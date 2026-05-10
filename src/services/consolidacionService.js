import apiClient from './api';

const consolidacionService = {
  // Obtiene indicadores y tabla de turnos pendientes
  getResumen: async () => {
    try {
      const response = await apiClient.get('/consolidacion/');
      return response.data;
    } catch (error) {
      console.error('Error en getResumen:', error);
      throw error;
    }
  },

  // Ejecuta la acción de consolidar un turno específico
  consolidarTurno: async (turnoId) => {
    try {
      const response = await apiClient.post(`/consolidacion/${turnoId}/consolidar/`);
      return response.data;
    } catch (error) {
      console.error('Error en consolidarTurno:', error);
      throw error;
    }
  }
};

export default consolidacionService;