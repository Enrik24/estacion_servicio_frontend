import React, { useEffect, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import Card from '../components/ui/Card';
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

  if (loading) return (
    <div className="flex min-h-screen bg-gray-50">
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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header showNav={false} showUserMenu variant="light" fixed={false} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-slate-900">💰 Validación y Consolidación de Caja</h1>
              <p className="text-gray-600 mt-1">Gestione los turnos y consolide los montos de caja</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                ⚠️ {error}
              </div>
            )}

            {/* Seccion de Indicadores (Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 border-l-4 border-l-blue-500">
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Turnos por Validar</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{data.indicadores?.turnos_pendientes ?? 0}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 border-l-4 border-l-purple-500">
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Total Facturas (Hoy)</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{data.indicadores?.total_facturas ?? 0}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 border-l-4 border-l-red-500">
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Monto Faltante Total</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  Bs. {typeof data.indicadores?.monto_faltantes === 'number' ? data.indicadores.monto_faltantes.toFixed(2) : "0.00"}
                </p>
              </div>
            </div>

            {/* Tabla de Datos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-slate-900">📋 Turnos Pendientes</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 font-semibold text-sm text-gray-700">Operador</th>
                      <th className="px-6 py-3 font-semibold text-sm text-gray-700">Sucursal</th>
                      <th className="px-6 py-3 font-semibold text-sm text-gray-700">Venta (Sistema)</th>
                      <th className="px-6 py-3 font-semibold text-sm text-gray-700">Diferencia</th>
                      <th className="px-6 py-3 font-semibold text-sm text-gray-700">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.tabla && Array.isArray(data.tabla) && data.tabla.length > 0 ? (
                      data.tabla.map((turno) => (
                        <tr key={turno.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 font-semibold text-gray-900">{turno.operador_nombre || turno.operador || 'N/A'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{turno.ubicacion || turno.sucursal_nombre || turno.sucursal || 'N/A'}</td>
                          <td className="px-6 py-4 font-semibold text-gray-900">
                            Bs. {typeof turno.monto_sistema === 'number' ? turno.monto_sistema.toFixed(2) : "0.00"}
                          </td>
                          <td className={`px-6 py-4 font-bold ${turno.diferencia < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            Bs. {typeof turno.diferencia === 'number' ? turno.diferencia.toFixed(2) : "0.00"}
                          </td>
                          <td className="px-6 py-4">
                            <Button 
                              onClick={() => handleConsolidar(turno.id)}
                              disabled={consolidating === turno.id}
                              className={`${
                                consolidating === turno.id 
                                  ? 'opacity-50 cursor-not-allowed' 
                                  : 'hover:bg-emerald-600'
                              }`}
                            >
                              {consolidating === turno.id ? '⏳ Procesando...' : '✓ Consolidar'}
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                          {error ? '❌ Error al cargar datos' : '✓ No hay turnos pendientes de validación'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ConsolidacionCaja;