import apiClient from './api';

export const prepaidService = {
  // Paso 1: Obtener tipos de combustible
  getFuelPrices: async () => {
    const response = await apiClient.get('/precios-combustible/');
    return response.data;
  },

  // Paso 1: Obtener sucursales
  getBranches: async () => {
    const response = await apiClient.get('/sucursales/');
    return response.data;
  },

  // Paso 2: Crear orden prepago (devuelve client_secret y orden_id)
  createPrepaidOrder: async (orderData) => {
    // orderData: { sucursal_id, tipo_combustible_id, litros o monto_total }
    const response = await apiClient.post('/prepago/crear/', orderData);
    return response.data;
  },

  // Paso 3 / historial: Listar órdenes
  getMyOrders: async () => {
    const response = await apiClient.get('/prepago/mis-ordenes/');
    return response.data;
  },

  downloadPDF: async (orderId) => {
    try {
      const response = await apiClient.get(`/prepago/${orderId}/pdf/`);
      const { pdf_base64, filename } = response.data;
      const byteCharacters = atob(pdf_base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename || `comprobante_prepago_${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Error en downloadPDF service:', error);
      throw error;
    }
  }
};
