import React, { useState, useEffect } from 'react';
import { Receipt, RefreshCw, Plus, ClipboardList, CreditCard } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { comprasService } from '../services/comprasService';
import { pdf } from '@react-pdf/renderer';
import { ComprobanteProveedorPDF } from '../components/ComprobanteProveedorPDF';

export default function ControlComprasPage() {
  const [activeTab, setActiveTab] = useState('cu19'); // 'cu19' o 'cu20'
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Estados de datos (Cargados desde el backend de Django)
  const [ordenes, setOrdenes] = useState([]);
  const [pagos, setPagos] = useState([]);

  // Formulario CU 19
  const [formOC, setFormOC] = useState({
    tipo_combustible: '1', 
    volumen_solicitado: '',
    precio_unitario: '' 
  });

  // Formulario CU 20
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
      setFormOC({ tipo_combustible: '1', volumen_solicitado: '', precio_unitario: '' });
      cargarDatos();
    } catch (error) {
      mostrarAlerta('error', error.response?.data?.volumen_solicitado?.[0] || 'Error al emitir la orden.');
    } finally {
      setLoading(false);
    }
  };

  // Enviar CU 20
  const handleSubmitPago = async (e) => {
    e.preventDefault();
    if (!formPago.orden_compra_id) {
      return mostrarAlerta('error', 'Debe seleccionar una Orden de Compra para conciliar.');
    }

    const ordenSeleccionada = ordenes.find(o => o.id === parseInt(formPago.orden_compra_id));
    if (!ordenSeleccionada) {
      return mostrarAlerta('error', 'La Orden de Compra seleccionada es inválida.');
    }
    
    setLoading(true);
    try {
      let archivoComprobante = formPago.comprobante_digital;
      
      if (!archivoComprobante) {
        const contenidoSimulado = `Comprobante de Pago Virtual YPFB\nMonto Conciliado: ${ordenSeleccionada.total_gasto} Bs.`;
        const blobVirtual = new Blob([contenidoSimulado], { type: 'text/plain' });
        archivoComprobante = new File([blobVirtual], `voucher_auto_${Date.now()}.txt`, { type: 'text/plain' });
      }

      const payload = {
        orden_compra: parseInt(formPago.orden_compra_id),
        monto_pagado: parseFloat(ordenSeleccionada.total_gasto).toFixed(2),
        metodo_pago: formPago.metodo_pago,
        comprobante_digital: archivoComprobante
      };

      await comprasService.registrarPagoProveedor(payload);
      
      mostrarAlerta('success', 'Prepago a YPFB conciliado de manera automática. Suministro autorizado.');
      setFormPago({ orden_compra_id: '', metodo_pago: 'TRANSFERENCIA', comprobante_digital: null });
      cargarDatos();
    } catch (error) {
      const errorBackend = error.response?.data;
      let mensajeDetalle = 'Error al conciliar el depósito bancario.';
      
      if (errorBackend) {
        if (typeof errorBackend === 'object') {
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

  const handleVerPDF = async (pago) => {
    try {
      // 1. Armamos el objeto con la estructura que tu PDF necesita
      const pagoDataEstructurada = {
        id_correlativo: pago.id,
        fecha: new Date(pago.fecha_pago).toLocaleDateString(),
        metodo_pago: pago.metodo_pago,
        nro_referencia: pago.nro_referencia,
        proveedor: {
          razon_social: "YPFB Corporación",
          nit: "1020269024"
        },
        detalles: [
          {
            nro_factura: `FAC-COMP-${pago.orden_compra}`,
            concepto: `Aprovisionamiento de Combustible Regulado - Orden #${pago.orden_compra}`,
            monto: pago.monto_pagado
          }
        ]
      };

      // 2. Generamos el documento PDF en memoria como un Blob
      const doc = <ComprobanteProveedorPDF pagoData={pagoDataEstructurada} />;
      const blob = await pdf(doc).toBlob();

      // 3. Creamos una URL temporal segura y la abrimos en el navegador
      const urlComponente = URL.createObjectURL(blob);
      window.open(urlComponente, '_blank');
    } catch (err) {
      mostrarAlerta('error', 'No se pudo generar la previsualización del comprobante contable.');
    }
  };
  
  const ordenesPendientes = ordenes.filter(o => o.estado === 'PENDIENTE');


  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Estructura del Layout unificada */}
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header showNav={false} showUserMenu variant="light" fixed={false} adminMode />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto space-y-6">
          
          {/* Encabezado Principal */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-6 h-6 text-emerald-500" />
                Módulo de Aprovisionamiento e Inventario
              </h1>
              <p className="text-xs text-gray-400 mt-1">Gestión contable de suministro y transacciones mayoristas de combustible.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={cargarDatos} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:bg-gray-50 transition">
                <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Alertas del Sistema */}
          {mensaje.texto && (
            <div className={`p-4 rounded-xl text-sm font-semibold border transition-all ${
              mensaje.tipo === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {mensaje.tipo === 'success' ? '✅ ' : '❌ '} {mensaje.texto}
            </div>
          )}

          {/* Tabs del Módulo */}
          <div className="flex space-x-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('cu19')}
              className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider transition-all border-b-2 ${
                activeTab === 'cu19' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              📋 Órdenes de Compra (Cupo ANH)
            </button>
            <button
              onClick={() => setActiveTab('cu20')}
              className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider transition-all border-b-2 ${
                activeTab === 'cu20' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              📋 Control de Pagos (YPFB Prepago)
            </button>
          </div>

          {/* CONTENIDO PESTAÑA 1: CU 19 */}
          {activeTab === 'cu19' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm border-b pb-2 border-gray-100">
                  <Plus className="w-4 h-4 text-blue-500" /> Emitir Orden de Compra
                </h3>
                <form onSubmit={handleSubmitOC} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Carburante</label>
                    <select
                      value={formOC.tipo_combustible} onChange={e => setFormOC({...formOC, tipo_combustible: e.target.value})}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white transition"
                    >
                      <option value="1">Gasolina Especial</option>
                      <option value="2">Diésel Oíl</option>
                      <option value="3">Gasolina Premium</option>
                      <option value="4">Gas Natural Vehicular (GNV)</option>
                    </select>
                  </div>
                  <Input label="Volumen Solicitado (Litros)" type="number" value={formOC.volumen_solicitado} onChange={e => setFormOC({...formOC, volumen_solicitado: e.target.value})} required />
                  <Input label="Precio Unitario (Bs/Litro)" type="number" step="0.01" value={formOC.precio_unitario} onChange={e => setFormOC({...formOC, precio_unitario: e.target.value})} required />
                  <Button type="submit" loading={loading}>💾 Registrar Orden</Button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Historial de Órdenes Emitidas</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100/70 text-gray-500 text-[10px] uppercase font-bold border-b border-gray-200">
                        <th className="px-6 py-3">Código / Fecha</th>
                        <th className="px-6 py-3">Combustible</th>
                        <th className="px-6 py-3 text-right">Volumen</th>
                        <th className="px-6 py-3 text-right">Gasto Total</th>
                        <th className="px-6 py-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs text-gray-600">
                      {Array.isArray(ordenes) && ordenes.map(o => (
                        <tr key={o.id} className="hover:bg-gray-50/80 transition">
                          <td className="px-6 py-4 font-mono font-bold text-slate-900">
                            {o.codigo_oc}
                            <p className="text-[10px] text-gray-400 font-sans font-normal mt-0.5">{new Date(o.fecha_emision).toLocaleDateString()}</p>
                          </td>
                          <td className="px-6 py-4 font-medium">{o.tipo_combustible_nombre || 'Combustible'}</td>
                          <td className="px-6 py-4 text-right font-mono">{parseFloat(o.volumen_solicitado).toLocaleString()} Lts</td>
                          <td className="px-6 py-4 text-right font-bold font-mono text-slate-800">Bs. {parseFloat(o.total_gasto).toLocaleString()}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm border-b pb-2 border-gray-100">
                  <CreditCard className="w-4 h-4 text-emerald-500" /> Registrar Depósito / Prepago
                </h3>
                <form onSubmit={handleSubmitPago} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Seleccionar OC Pendiente</label>
                    <select
                      value={formPago.orden_compra_id} 
                      onChange={e => setFormPago({...formPago, orden_compra_id: e.target.value})}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 font-mono focus:bg-white transition"
                    >
                      <option value="">-- Seleccionar Orden --</option>
                      {ordenesPendientes.map(o => (
                        <option key={o.id} value={o.id}>
                          {o.codigo_oc} (Total Gasto: {o.total_gasto} Bs.)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Canal Financiero Estatal</label>
                    <select
                      value={formPago.metodo_pago} onChange={e => setFormPago({...formPago, metodo_pago: e.target.value})}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white transition"
                    >
                      <option value="TRANSFERENCIA">Transferencia Electrónica (SIGMA/Unión)</option>
                      <option value="DEPOSITO">Depósito Bancario en Ventanilla</option>
                      <option value="QR">Pago Único por QR del Estado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Comprobante Digital</label>
                    <input
                      type="file" accept=".pdf,image/*" 
                      onChange={e => setFormPago({...formPago, comprobante_digital: e.target.files[0]})}
                      className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition"
                    />
                  </div>
                  <Button type="submit" loading={loading}>💳 Validar Pago y Autorizar</Button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Bitácora Contable de Prepagos Conciliados</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100/70 text-gray-500 text-[10px] uppercase font-bold border-b border-gray-200">
                        <th className="px-6 py-3">ID Pago</th>
                        <th className="px-6 py-3">Referencia Canal</th>
                        <th className="px-6 py-3 text-right">Monto Liquidado</th>
                        <th className="px-6 py-3 text-center">Comprobante</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs text-gray-600">
                      {Array.isArray(pagos) && pagos.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50/80 transition">
                          <td className="px-6 py-4 font-mono font-bold text-slate-900">
                            #PAG-{p.id}
                            <p className="text-[10px] text-gray-400 font-sans font-normal mt-0.5">{new Date(p.fecha_pago).toLocaleDateString()}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-800">{p.metodo_pago}</span>
                            <p className="text-[10px] text-gray-500 font-mono mt-0.5">Ref: {p.nro_referencia}</p>
                          </td>
                          <td className="px-6 py-4 text-right font-bold font-mono text-emerald-700">Bs. {parseFloat(p.monto_pagado).toLocaleString()}</td>
                          <td className="px-4 py-4 text-center">
                            <button
                                onClick={() => handleVerPDF(p)}
                                className="text-blue-600 font-bold hover:text-blue-800 hover:underline bg-transparent border-0 cursor-pointer flex items-center justify-center mx-auto gap-1"
                            >
                            📄 Ver Comprobante
                            </button>
                           </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}