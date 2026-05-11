import React, { useEffect, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
import { toast } from 'react-hot-toast';
import consolidacionService from '../services/consolidacionService';

const ConsolidacionCaja = () => {
  const [data, setData] = useState({ indicadores: {}, tabla: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [consolidating, setConsolidating] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await consolidacionService.getResumen();
      console.log('📤 Respuesta completa del backend:', result);
      
      // Extraer datos del response
      let processedData = { indicadores: {}, tabla: [] };
      
      // Si result es un objeto con propiedades
      if (result && typeof result === 'object') {
        // Buscar indicadores
        if (result.indicadores) {
          processedData.indicadores = result.indicadores;
          console.log('✅ Indicadores encontrados:', result.indicadores);
        }
        
        // Buscar tabla - puede estar en diferentes ubicaciones
        let tableData = [];
        if (result.tabla && Array.isArray(result.tabla)) {
          tableData = result.tabla;
          console.log('✅ Tabla encontrada en result.tabla');
        } else if (result.data && Array.isArray(result.data)) {
          tableData = result.data;
          console.log('✅ Tabla encontrada en result.data');
        } else if (result.results && Array.isArray(result.results)) {
          tableData = result.results;
          console.log('✅ Tabla encontrada en result.results');
        } else if (Array.isArray(result)) {
          tableData = result;
          console.log('✅ Result es un array directo');
        }
        
        processedData.tabla = tableData;
        console.log(`✅ Total de turnos: ${tableData.length}`, tableData);
      }
      
      setData(processedData);
      
      // Validar que se cargaron datos
      if (processedData.tabla.length === 0) {
        console.warn('⚠️ No hay turnos pendientes o no se encontraron datos');
      }
      
    } catch (err) {
      console.error('❌ Error al cargar consolidación:', err);
      console.error('📥 Detalles del error:', err.response?.data);
      setError(err.response?.data?.detail || err.message || 'No se pudieron cargar los datos de consolidación');
      toast.error("Error al cargar datos de consolidación");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  const handleConsolidar = async (id) => {
    if (!window.confirm("¿Está seguro de consolidar esta caja? Esta acción se registrará en bitácora.")) return;
    
    try {
      setConsolidating(id);
      console.log(`🔄 Consolidando turno ${id}...`);
      
      await consolidacionService.consolidarTurno(id);
      
      console.log(`✅ Turno ${id} consolidado exitosamente`);
      toast.success("Turno consolidado exitosamente");
      
      // Esperar un segundo y luego recargar
      setTimeout(() => {
        fetchData();
      }, 1000);
      
    } catch (err) {
      console.error('❌ Error al consolidar:', err);
      console.error('📥 Error response:', err.response?.data);
      
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.detail || 
                          err.response?.data?.error ||
                          "Error al consolidar el turno";
      
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setConsolidating(null);
    }
  };

  // Calcular totales
  const calcularTotales = () => {
    const ventaTotal = data.tabla.reduce((sum, turno) => sum + (turno.monto_sistema || 0), 0);
    const diferenciaTotalMonto = data.tabla.reduce((sum, turno) => sum + (turno.diferencia || 0), 0);
    return {
      ventaTotal: ventaTotal.toFixed(2),
      diferenciaTotalMonto: diferenciaTotalMonto.toFixed(2)
    };
  };

  const totales = calcularTotales();
  const hoy = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();

  if (loading) return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header showNav={false} showUserMenu variant="light" fixed={false} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p>Cargando datos de consolidación...</p>
          </div>
        </main>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header showNav={false} showUserMenu variant="light" fixed={false} />
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6">
            
            {/* Indicadores - Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-xs uppercase font-bold mb-1">Venta Total (Sistema)</p>
                <h3 className="text-2xl font-bold">Bs. {totales.ventaTotal}</h3>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-xs uppercase font-bold mb-1">Total Facturas</p>
                <h3 className="text-2xl font-bold text-emerald-600">{data.indicadores?.total_facturas ?? 0}</h3>
              </div>
              <div className={`bg-white p-4 rounded-xl shadow-sm ${totales.diferenciaTotalMonto < 0 ? 'border border-red-100 bg-red-50' : 'border border-slate-200'}`}>
                <p className={`text-xs uppercase font-bold mb-1 ${totales.diferenciaTotalMonto < 0 ? 'text-red-500' : 'text-slate-500'}`}>Diferencia Total</p>
                <h3 className={`text-2xl font-bold ${totales.diferenciaTotalMonto < 0 ? 'text-red-600' : 'text-slate-700'}`}>
                  Bs. {totales.diferenciaTotalMonto}
                </h3>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-xs uppercase font-bold mb-1">Turnos Pendientes</p>
                <h3 className="text-2xl font-bold text-slate-700">{String(data.tabla.length).padStart(2, '0')}</h3>
              </div>
            </div>

            {/* Sección Principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Sidebar - Turnos del Día */}
              <div className="lg:col-span-1 space-y-4">
                <h2 className="text-sm font-black text-slate-500 uppercase tracking-tighter mb-4">Turnos del Día</h2>
                
                {data.tabla && Array.isArray(data.tabla) && data.tabla.length > 0 ? (
                  data.tabla.map((turno, index) => (
                    <div 
                      key={turno.id}
                      className={`bg-white p-4 rounded-lg border-l-4 shadow-sm transition ${
                        index === 0 
                          ? 'border-l-emerald-500 hover:bg-slate-50 cursor-pointer' 
                          : 'border-l-slate-300 opacity-60 grayscale'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${
                          index === 0
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {turno.turno_tipo || 'TURNO'}
                        </span>
                      </div>
                      <p className="font-bold text-sm text-slate-800">{turno.operador_nombre || turno.operador || 'N/A'}</p>
                      <p className={`text-xs ${index === 0 ? 'text-slate-500' : 'text-slate-400 italic'}`}>
                        {index === 0 ? `Ubicación: ${turno.ubicacion || turno.sucursal_nombre || 'N/A'}` : 'Esperando cierre de sesión...'}
                      </p>
                      <div className="mt-3 flex justify-between items-center text-xs">
                        <span className="text-slate-600">Venta: Bs. {typeof turno.monto_sistema === 'number' ? turno.monto_sistema.toFixed(2) : '0.00'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white p-4 rounded-lg border border-slate-200 text-center text-slate-500">
                    ✓ No hay turnos pendientes
                  </div>
                )}
              </div>

              {/* Tabla Principal */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center flex-wrap gap-4">
                  <h2 className="font-bold text-slate-800">💰 Cuadre de Caja por Ventas</h2>
                  <span className="text-[10px] bg-slate-200 px-2 py-1 rounded font-bold text-slate-600">{hoy}</span>
                  <div className="space-x-2">
                    <button className="bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs font-bold hover:bg-slate-300 transition">
                      Exportar Excel
                    </button>
                    <button className="bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs font-bold hover:bg-slate-300 transition">
                      Ver PDF
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-4">Operador</th>
                        <th className="p-4 text-center">Sucursal</th>
                        <th className="p-4 text-center">Diferencia</th>
                        <th className="p-4 text-right">Monto (Bs)</th>
                        <th className="p-4 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.tabla && Array.isArray(data.tabla) && data.tabla.length > 0 ? (
                        data.tabla.map((turno) => (
                          <tr key={turno.id} className="hover:bg-slate-50 transition">
                            <td className="p-4 font-bold text-slate-700">{turno.operador_nombre || turno.operador || 'N/A'}</td>
                            <td className="p-4 text-center text-slate-600 text-sm">{turno.ubicacion || turno.sucursal_nombre || turno.sucursal || 'N/A'}</td>
                            <td className={`p-4 text-center font-bold text-sm ${turno.diferencia < 0 ? 'text-red-600' : 'text-green-600'}`}>
                              Bs. {typeof turno.diferencia === 'number' ? turno.diferencia.toFixed(2) : "0.00"}
                            </td>
                            <td className="p-4 text-right font-bold">
                              Bs. {typeof turno.monto_sistema === 'number' ? turno.monto_sistema.toFixed(2) : "0.00"}
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleConsolidar(turno.id)}
                                disabled={consolidating === turno.id}
                                className={`px-3 py-1 rounded text-xs font-bold transition ${
                                  consolidating === turno.id
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                }`}
                              >
                                {consolidating === turno.id ? '⏳ Procesando...' : '✓ Consolidar'}
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-slate-500">
                            {error ? '❌ Error al cargar datos' : '✓ No hay turnos pendientes de validación'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Total Consolidado */}
                <div className="p-6 bg-slate-50 border-t border-slate-200">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Consolidado</p>
                      <p className="text-2xl font-black text-emerald-600 italic">Bs. {totales.ventaTotal}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mensaje de Error */}
            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                ⚠️ {error}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ConsolidacionCaja;