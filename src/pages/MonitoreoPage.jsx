import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Activity } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import IslaCard from '../components/monitoreo/IslaCard';
import apiClient from '../services/api';

function MonitoreoPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [ultimaActualizacion, setUltimaActualizacion] = useState(null);const [historial, setHistorial] = useState([]);
const [showHistorial, setShowHistorial] = useState(false);
const [loadingHistorial, setLoadingHistorial] = useState(false);

    const cargarMonitoreo = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/monitoreo/surtidores/');
            const result = Array.isArray(res.data) ? res.data : res.data.results || [];
            setData(result);
            setUltimaActualizacion(new Date());
            setError(null);
        } catch {
            setError('Error al cargar datos de monitoreo');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargarMonitoreo();
        // Auto-refresh cada 30 segundos
        const interval = setInterval(cargarMonitoreo, 30000);
        return () => clearInterval(interval);
    }, [cargarMonitoreo]);

    const handleCambiarEstado = async (ladoId, nuevoEstado, descripcion) => {
        try {
            await apiClient.post('/monitoreo/surtidores/cambiar_estado/', {
                lado_id: ladoId,
                estado: nuevoEstado,
                descripcion,
            });
            await cargarMonitoreo();
        } catch {
            setError('Error al cambiar estado del surtidor');
        }
    };
const cargarHistorial = async () => {
    setLoadingHistorial(true);
    try {
        const res = await apiClient.get('/monitoreo/surtidores/historial/');
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setHistorial(data);
    } catch {
        console.error('Error cargando historial');
    } finally {
        setLoadingHistorial(false);
    }
};
    const totalIslas = data.reduce((acc, s) => acc + s.islas.length, 0);
    const totalFallas = data.reduce((acc, s) =>
        acc + s.islas.reduce((a, i) =>
            a + i.lados.filter(l => l.estado === 'FALLA').length, 0), 0);
    const totalInactivos = data.reduce((acc, s) =>
        acc + s.islas.reduce((a, i) =>
            a + i.lados.filter(l => l.estado === 'INACTIVO').length, 0), 0);

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Header showNav={false} showUserMenu variant="light" fixed={false} adminMode />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto space-y-6">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                <Activity className="w-6 h-6 text-emerald-500" />
                                Monitoreo de Surtidores
                            </h1>
                            {ultimaActualizacion && (
                                <p className="text-xs text-gray-400 mt-1">
                                    Última actualización: {ultimaActualizacion.toLocaleTimeString()}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2">
    <button
        onClick={() => { setShowHistorial(!showHistorial); if (!showHistorial) cargarHistorial(); }}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-gray-50"
    >
        Historial de estados
    </button>
    <button
        onClick={cargarMonitoreo}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
    >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        Actualizar
    </button>
</div>
                    </div>

                    {/* KPIs */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                            <p className="text-xs text-gray-500 uppercase font-semibold">Total Islas</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">{totalIslas}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                            <p className="text-xs text-gray-500 uppercase font-semibold">Fallas activas</p>
                            <p className={`text-2xl font-bold mt-1 ${totalFallas > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                {totalFallas}
                            </p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                            <p className="text-xs text-gray-500 uppercase font-semibold">Inactivos</p>
                            <p className="text-2xl font-bold text-gray-500 mt-1">{totalInactivos}</p>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Sucursales e Islas */}
                    {data.map(sucursal => (
                        <div key={sucursal.sucursal_id} className="space-y-3">
                            <h2 className="text-lg font-bold text-slate-800 border-b border-gray-200 pb-2">
                                {sucursal.sucursal_nombre}
                            </h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {sucursal.islas.map(isla => (
                                    <IslaCard
                                        key={isla.id}
                                        isla={isla}
                                        onCambiarEstado={handleCambiarEstado}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                    {showHistorial && (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="font-bold text-slate-900">Historial de cambios de estado</h2>
        </div>
        {loadingHistorial ? (
            <div className="p-8 text-center text-gray-400 text-sm">Cargando historial...</div>
        ) : historial.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No hay cambios registrados</div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Fecha</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Sucursal</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Isla</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Lado</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Anterior</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Nuevo</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Descripción</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Reportado por</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {historial.map(h => (
                            <tr key={h.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                    {new Date(h.fecha).toLocaleString('es-BO')}
                                </td>
                                <td className="px-4 py-3 text-gray-600">{h.sucursal_nombre}</td>
                                <td className="px-4 py-3 text-gray-600">Isla {h.isla_numero}</td>
                                <td className="px-4 py-3 text-gray-600">Lado {h.lado_letra}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        h.estado_anterior === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700' :
                                        h.estado_anterior === 'FALLA' ? 'bg-red-100 text-red-700' :
                                        'bg-gray-100 text-gray-600'
                                    }`}>
                                        {h.estado_anterior}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        h.estado_nuevo === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700' :
                                        h.estado_nuevo === 'FALLA' ? 'bg-red-100 text-red-700' :
                                        'bg-gray-100 text-gray-600'
                                    }`}>
                                        {h.estado_nuevo}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-600">{h.descripcion || '—'}</td>
                                <td className="px-4 py-3 text-gray-600">{h.cambiado_por}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
)}
                </main>
            </div>
        </div>
    );
}

export default MonitoreoPage;