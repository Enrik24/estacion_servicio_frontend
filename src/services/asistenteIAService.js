import apiClient from './api';

/**
 * Asistente Conversacional con IA.
 * Envía una pregunta en lenguaje natural y el historial reciente de la
 * conversación; el backend interpreta, consulta los datos reales de la
 * sucursal (multi-tenant) y responde en lenguaje natural.
 */
export const asistenteIAService = {
  preguntar: (pregunta, historial = []) =>
    apiClient.post('/reportes/asistente/', { pregunta, historial }),
};

export default asistenteIAService;
