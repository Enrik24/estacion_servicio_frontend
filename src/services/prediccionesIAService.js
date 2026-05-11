import apiClient from './api';

export const prediccionesIAService = {
  predecir: (payload) => apiClient.post('/predicciones-consumo/', payload),
};

export default prediccionesIAService;
