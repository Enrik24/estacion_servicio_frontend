import React, { useEffect, useState } from 'react';
import consolidacionService from '../services/consolidacionService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { toast } from 'react-hot-toast'; // O la librería de alertas que uses

const ConsolidacionCaja = () => {
  const [data, setData] = useState({ indicadores: {}, tabla: [] });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const result = await consolidacionService.getResumen();
      setData(result);
    } catch (error) {
      toast.error("Error al cargar datos de consolidación");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleConsolidar = async (id) => {
    if (!window.confirm("¿Está seguro de consolidar esta caja? Esta acción se registrará en bitácora.")) return;
    
    try {
      await consolidacionService.consolidarTurno(id);
      toast.success("Turno consolidado exitosamente");
      fetchData(); // Recargamos para actualizar indicadores y quitar el turno de la lista
    } catch (error) {
      toast.error("Error al consolidar el turno");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Validación y Consolidación de Caja</h1>

      {/* Seccion de Indicadores (Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white p-4 border-l-4 border-blue-500">
          <p className="text-sm text-slate-500 font-medium">Turnos por Validar</p>
          <p className="text-2xl font-bold">{data.indicadores.turnos_pendientes || 0}</p>
        </Card>
        <Card className="bg-white p-4 border-l-4 border-purple-500">
          <p className="text-sm text-slate-500 font-medium">Total Facturas (Hoy)</p>
          <p className="text-2xl font-bold">{data.indicadores.total_facturas || 0}</p>
        </Card>
        <Card className="bg-white p-4 border-l-4 border-red-500">
          <p className="text-sm text-slate-500 font-medium">Monto Faltante Total</p>
          <p className="text-2xl font-bold text-red-600">Bs. {data.indicadores.monto_faltantes?.toFixed(2) || "0.00"}</p>
        </Card>
      </div>

      {/* Tabla de Datos */}
      <Card className="overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-4 font-semibold text-slate-600">Operador</th>
              <th className="p-4 font-semibold text-slate-600">Ubicación</th>
              <th className="p-4 font-semibold text-slate-600">Venta (Sistema)</th>
              <th className="p-4 font-semibold text-slate-600">Diferencia</th>
              <th className="p-4 font-semibold text-slate-600">Acción</th>
            </tr>
          </thead>
          <tbody>
            {data.tabla.map((turno) => (
              <tr key={turno.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="p-4">{turno.operador_nombre}</td>
                <td className="p-4 text-sm text-slate-500">{turno.ubicacion}</td>
                <td className="p-4">Bs. {turno.monto_sistema.toFixed(2)}</td>
                <td className={`p-4 font-bold ${turno.diferencia < 0 ? 'text-red-500' : 'text-green-500'}`}>
                  Bs. {turno.diferencia.toFixed(2)}
                </td>
                <td className="p-4">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => handleConsolidar(turno.id)}
                  >
                    Consolidar
                  </Button>
                </td>
              </tr>
            ))}
            {data.tabla.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-400">No hay turnos pendientes de validación</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default ConsolidacionCaja;