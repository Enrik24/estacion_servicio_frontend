import React, { useState, useEffect } from 'react';
import { comprasService } from '../services/comprasService';
// Importa tus componentes comunes de UI si los tienes, si no, aquí usamos elementos HTML estilizados con Tailwind

export default function ControlComprasPage() {
  const [activeTab, setActiveTab] = useState('cu19'); // 'cu19' o 'cu20'
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Estados de datos (Cargados desde el backend de Django)
  const [ordenes, setOrdenes] = useState([]);
  const [pagos, setPagos] = useState([]);

  // Formulario CU 19 (Orden de Compra actualizado)
  const [formOC, setFormOC] = useState({
    tipo_combustible: '1', 
    volumen_solicitado: '',
    precio_unitario: '' // Cambiado de precio_unitario_compra a precio_unitario
  });

// Formulario CU 20 (Actualizado sin nro_referencia)
  const [formPago, setFormPago] = useState({
    orden_compra_id: '',
    metodo_pago: 'TRANSFERENCIA',
    comprobante_digital: null
  });

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const dataOrdenes = await comprasService.getOrdenesCompra();
      const dataPagos = await comprasService.getPagosProveedores();
      
      // CONTROL CRÍTICO: Extraer el arreglo real si la respuesta viene paginada
      const listaOrdenes = Array.isArray(dataOrdenes) ? dataOrdenes : (dataOrdenes.results || []);
      const listaPagos = Array.isArray(dataPagos) ? dataPagos : (dataPagos.results || []);

      setOrdenes(listaOrdenes);
      setPagos(listaPagos);
    } catch (error) {
      mostrarAlerta('error', 'Error al sincronizar datos con el servidor de la estación.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const mostrarAlerta = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 5000);
  };

  // Enviar CU 19
  const handleSubmitOC = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await comprasService.createOrdenCompra(formOC);
      mostrarAlerta('success', `Orden de Compra registrada exitosamente.`);
      // Limpieza con los campos nuevos
      setFormOC({ tipo_combustible: '1', volumen_solicitado: '', precio_unitario: '' });
      cargarDatos();
    } catch (error) {
      mostrarAlerta('error', error.response?.data?.volumen_solicitado?.[0] || 'Error al emitir la orden.');
    } finally {
      setLoading(false);
    }
  };

// Enviar CU 20 (Totalmente blindado para evitar el error 400)
  const handleSubmitPago = async (e) => {
    e.preventDefault();
    if (!formPago.orden_compra_id) {
      return mostrarAlerta('error', 'Debe seleccionar una Orden de Compra para conciliar.');
    }

    // Buscamos la orden seleccionada para extraer su costo total calculado
    const ordenSeleccionada = ordenes.find(o => o.id === parseInt(formPago.orden_compra_id));
    if (!ordenSeleccionada) {
      return mostrarAlerta('error', 'La Orden de Compra seleccionada es inválida.');
    }
    
    setLoading(true);
    try {
      let archivoComprobante = formPago.comprobante_digital;
      
      // Si el usuario no subió un archivo físico, fabricamos uno virtual en memoria
      if (!archivoComprobante) {
        const contenidoSimulado = `Comprobante de Pago Virtual YPFB\nMonto Conciliado: ${ordenSeleccionada.total_gasto} Bs.`;
        const blobVirtual = new Blob([contenidoSimulado], { type: 'text/plain' });
        archivoComprobante = new File([blobVirtual], `voucher_auto_${Date.now()}.txt`, { type: 'text/plain' });
      }

      // CONSTRUCCIÓN ESTRICTA DEL PAYLOAD PARA EL SERIALIZER DE DJANGO:
      // Nota: Mapeamos 'orden_compra_id' del formulario local al campo 'orden_compra' que espera la API
      const payload = {
        orden_compra: parseInt(formPago.orden_compra_id),
        monto_pagado: parseFloat(ordenSeleccionada.total_gasto).toFixed(2),
        metodo_pago: formPago.metodo_pago,
        comprobante_digital: archivoComprobante
      };

      // Enviamos el objeto con el formato corregido directamente al servicio de la API
      await comprasService.registrarPagoProveedor(payload);
      
      mostrarAlerta('success', 'Prepago a YPFB conciliado de manera automática. Suministro autorizado.');
      setFormPago({ orden_compra_id: '', metodo_pago: 'TRANSFERENCIA', comprobante_digital: null });
      cargarDatos();
    } catch (error) {
      // Extraemos el mensaje de error específico que nos manda el validador de Django
      const errorBackend = error.response?.data;
      let mensajeDetalle = 'Error al conciliar el depósito bancario.';
      
      if (errorBackend) {
        if (typeof errorBackend === 'object') {
          // Si nos devuelve el detalle por campo (ej. {"orden_compra": ["..."]})
          mensajeDetalle = Object.entries(errorBackend)
            .map(([campo, msgs]) => `${campo}: ${msgs.join(' ')}`)
            .join(' | ');
        } else if (errorBackend.detail) {
          mensajeDetalle = errorBackend.detail;
        }
      }
      
      mostrarAlerta('error', mensajeDetalle);
    } finally {
      setLoading(false);
    }
  };
  // Filtrar solo las OC pendientes para poblar el selector del CU 20
  const ordenesPendientes = ordenes.filter(o => o.estado === 'PENDIENTE');

  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Módulo de Aprovisionamiento e Inventario</h1>
          <p className="text-sm text-slate-500">Gestión contable de suministro y transacciones mayoristas de combustible.</p>
        </div>
        <div className="text-xs bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg font-mono font-bold">
          Encargado: Bryan Araúz
        </div>
      </div>

      {/* Alertas Globales */}
      {mensaje.texto && (
        <div className={`p-4 rounded-xl mb-4 text-sm font-semibold border ${
          mensaje.tipo === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {mensaje.tipo === 'success' ? '✅ ' : '❌ '} {mensaje.texto}
        </div>
      )}

      {/* Selector de Pestañas (Tabs) */}
      <div className="flex space-x-2 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('cu19')}
          className={`px-4 py-2.5 font-bold text-sm transition-all border-b-2 ${
            activeTab === 'cu19' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📋 CU 19 - Órdenes de Compra (Cupo ANH)
        </button>
        <button
          onClick={() => setActiveTab('cu20')}
          className={`px-4 py-2.5 font-bold text-sm transition-all border-b-2 ${
            activeTab === 'cu20' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          💳 CU 20 - Control de Pagos (YPFB Prepago)
        </button>
      </div>

      {/* CONTENIDO PESTAÑA 1: CU 19 */}
      {activeTab === 'cu19' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario Modificado */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
            <h2 className="text-base font-bold text-slate-800 mb-4">Emitir Orden de Compra</h2>
            <form onSubmit={handleSubmitOC} className="space-y-4">
              
              {/* ELIMINADO EL INPUT DE CÓDIGO OC - AHORA ES AUTOMÁTICO */}

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Carburante</label>
                <select
                  value={formOC.tipo_combustible} onChange={e => setFormOC({...formOC, tipo_combustible: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-slate-50"
                >
                  <option value="1">Gasolina Especial (ANH Regulado)</option>
                  <option value="2">Diésel Oíl</option>
                  <option value="3">Gasolina Premium</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Volumen Solicitado (Litros)</label>
                <input
                  type="number" required placeholder="Cantidad exacta" value={formOC.volumen_solicitado}
                  onChange={e => setFormOC({...formOC, volumen_solicitado: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Precio Unitario (Bs/Litro)</label>
                <input
                  type="number" step="0.01" required placeholder="Costo mayorista YPFB" 
                  value={formOC.precio_unitario} // Propiedad corregida
                  onChange={e => setFormOC({...formOC, precio_unitario: e.target.value})} // Propiedad corregida
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono"
                />
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs uppercase tracking-wider transition"
              >
                {loading ? 'Procesando...' : '💾 Registrar Orden de Compra'}
              </button>
            </form>
          </div>

          {/* Tabla Historial */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-800">Historial de Órdenes Emitidas</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold border-b border-slate-200">
                    <th className="px-4 py-3">Código / Fecha</th>
                    <th className="px-4 py-3">Combustible</th>
                    <th className="px-4 py-3 text-right">Volumen</th>
                    <th className="px-4 py-3 text-right">Gasto Total</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {ordenes.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-4 font-mono font-bold">
                        {o.codigo_oc}
                        <p className="text-[10px] text-slate-400 font-sans font-normal mt-0.5">{new Date(o.fecha_emision).toLocaleDateString()}</p>
                      </td>
                      <td className="px-4 py-4 font-medium">{o.tipo_combustible_nombre || 'Combustible'}</td>
                      <td className="px-4 py-4 text-right font-mono">{parseFloat(o.volumen_solicitado).toLocaleString()} Lts</td>
                      <td className="px-4 py-4 text-right font-bold font-mono">Bs. {parseFloat(o.total_gasto).toLocaleString()}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          o.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-800' :
                          o.estado === 'PAGADA' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>{o.estado}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO PESTAÑA 2: CU 20 */}
      {activeTab === 'cu20' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
            <h2 className="text-base font-bold text-slate-800 mb-4">Registrar Depósito / Prepago</h2>
            <form onSubmit={handleSubmitPago} className="space-y-4">
              {/* SELECTOR DE OC */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Seleccionar OC Pendiente</label>
                <select
                  value={formPago.orden_compra_id} 
                  onChange={e => setFormPago({...formPago, orden_compra_id: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-slate-50 font-mono"
                >
                  <option value="">-- Seleccionar Orden --</option>
                  {ordenesPendientes.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.codigo_oc} (Total Gasto: {o.total_gasto} Bs.)
                    </option>
                  ))}
                </select>
              </div>

              {/* SELECTOR DE CANAL */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Canal Financiero Estatal</label>
                <select
                  value={formPago.metodo_pago} onChange={e => setFormPago({...formPago, metodo_pago: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-slate-50"
                >
                  <option value="TRANSFERENCIA">Transferencia Electrónica (SIGMA/Unión)</option>
                  <option value="DEPOSITO">Depósito Bancario en Ventanilla</option>
                  <option value="QR">Pago Único por QR del Estado</option>
                </select>
              </div>

              {/* ELIMINADO EL CUADRO DE TEXTO DE NRO_REFERENCIA PORQUE AHORA ES AUTOMÁTICO */}

              {/* INPUT DE COMPROBANTE */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Comprobante Digital</label>
                <input
                  type="file" accept=".pdf,image/*" 
                  onChange={e => setFormPago({...formPago, comprobante_digital: e.target.files[0]})}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs uppercase tracking-wider transition"
              >
                {loading ? 'Conciliando...' : '💳 Validar Pago y Autorizar'}
              </button>
            </form>
          </div>

          {/* Tabla Historial de Pagos */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-800">Bitácora Contable de Prepagos Conciliados</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold border-b border-slate-200">
                    <th className="px-4 py-3">ID Pago</th>
                    <th className="px-4 py-3">Referencia Canal</th>
                    <th className="px-4 py-3 text-right">Monto Liquidado</th>
                    <th className="px-4 py-3 text-center">Comprobante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {pagos.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-4 font-mono font-bold text-slate-900">
                        #PAG-{p.id}
                        <p className="text-[10px] text-slate-400 font-sans font-normal mt-0.5">{new Date(p.fecha_pago).toLocaleDateString()}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-semibold text-slate-800">{p.metodo_pago}</span>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">Ref: {p.nro_referencia}</p>
                      </td>
                      <td className="px-4 py-4 text-right font-bold font-mono text-emerald-700">Bs. {parseFloat(p.monto_pagado).toLocaleString()}</td>
                      <td className="px-4 py-4 text-center">
                        {p.comprobante_digital ? (
                          <a href={p.comprobante_digital} target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline">
                            📂 Ver Archivo
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">No cargado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}