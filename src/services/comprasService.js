import apiClient from './api';

export const comprasService = {
  // ─── CU 19: GESTIONAR ÓRDENES DE COMPRA ───
  
  // Listar todas las Órdenes de Compra (Para la tabla)
  getOrdenesCompra: async () => {
    const response = await apiClient.get('/inventario/ordenes-compra/');
    return response.data;
  },

  // Crear una nueva Orden de Compra
  createOrdenCompra: async (ordenData) => {
    // ordenData contiene: { codigo_oc, tipo_combustible, volumen_solicitado, precio_unitario_compra }
    const response = await apiClient.post('/inventario/ordenes-compra/', ordenData);
    return response.data;
  },


  // ─── CU 20: CONTROLAR PAGOS A PROVEEDORES ───
  
  // Listar todos los pagos registrados (Para la bitácora contable)
  getPagosProveedores: async () => {
    const response = await apiClient.get('/inventario/pagos-proveedores/');
    return response.data;
  },

  // Registrar un Prepago a YPFB (Multipart por el archivo adjunto)
  registrarPagoProveedor: async (pagoData) => {
    const formData = new FormData();
    formData.append('orden_compra', pagoData.orden_compra); 
    formData.append('monto_pagado', pagoData.monto_pagado);
    formData.append('metodo_pago', pagoData.metodo_pago);
    
    if (pagoData.comprobante_digital) {
      formData.append('comprobante_digital', pagoData.comprobante_digital);
    }

    const response = await apiClient.post('/inventario/pagos-proveedores/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};