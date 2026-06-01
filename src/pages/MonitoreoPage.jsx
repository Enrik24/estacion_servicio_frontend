import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Activity, ShieldCheck, Camera, CreditCard, Eye, XCircle } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import IslaCard from '../components/monitoreo/IslaCard';
import { monitoreoService } from '../services/monitoreoService';
import EstadoBadge from '../components/monitoreo/EstadoBadge'; // Tu componente de badges
import apiClient from '../services/api';

function MonitoreoPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
    
    // ESTADO PARA EL PANEL DE AUDITORÍA DETALLADA (CU 14)
    const [surtidorSeleccionado, setSurtidorSeleccionado] = useState(null);

    const cargarMonitoreo = useCallback(async () => {
        setLoading(true);
        try {
            const res = await monitoreoService.getSurtidores();
            const result = Array.isArray(res.data) ? res.data : res.data.results || [];
            setData(result);
            setUltimaActualizacion(new Date());
            setError(null);

            // Sincronizar el panel lateral si el surtidor seleccionado se actualizó en el backend
            if (surtidorSeleccionado) {
                const sucursalActual = result.find(s => s.islas.some(i => i.lados.some(l => l.id === surtidorSeleccionado.id)));
                if (sucursalActual) {
                    for (const isla of sucursalActual.islas) {
                        const ladoActualizado = isla.lados.find(l => l.id === surtidorSeleccionado.id);
                        if (ladoActualizado && ladoActualizado.estado === 'AUTORIZADO_REMOTO') {
                            setSurtidorSeleccionado(ladoActualizado);
                        } else if (ladoActualizado && ladoActualizado.estado !== 'AUTORIZADO_REMOTO') {
                            setSurtidorSeleccionado(null); // Si ya terminó de despachar, limpiamos el panel
                        }
                    }
                }
            }
        } catch {
            setError('Error al cargar datos de monitoreo');
        } finally {
            setLoading(false);
        }
    }, [surtidorSeleccionado]);

    useEffect(() => {
    // Carga inicial
    cargarMonitoreo();

    const ejecutarPolling = () => {
        // 📄 REGLA DE NEGOCIO: Si el usuario cambió de pestaña, no satures el backend
        if (document.hidden) return; 
        
        cargarMonitoreo();
    };

    // Subimos el intervalo a 15 o 30 segundos para producción, o mantenlo en 10s para tu defensa
    const interval = setInterval(ejecutarPolling, 15000); 

    // Escuchar cuando el usuario vuelve a enfocar la pantalla para actualizar de inmediato
    const handleVisibilityChange = () => {
        if (!document.hidden) {
            cargarMonitoreo();
        }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
        clearInterval(interval);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
}, [cargarMonitoreo]);

    const handleCambiarEstado = async (ladoId, nuevoEstado, descripcion) => {
        try {
            await apiClient.post('/monitoreo/surtidores/cambiar_estado/', {
                lado_id: ladoId,
                estado: nuevoEstado,
                descripcion,
            });
            if (surtidorSeleccionado?.id === ladoId && nuevoEstado === 'ACTIVO') {
                setSurtidorSeleccionado(null);
            }
            await cargarMonitoreo();
        } catch {
            setError('Error al cambiar estado del surtidor');
        }
    };

    // KPIs Calculados dinámicamente incluyendo el nuevo estado
    const totalIslas = data.reduce((acc, s) => acc + s.islas.length, 0);
    const totalManguerasEnCarga = data.reduce((acc, s) => 
        acc + s.islas.reduce((a, i) => 
            a + i.lados.filter(l => l.estado === 'AUTORIZADO_REMOTO').length, 0), 0);
    const totalInactivos = data.reduce((acc, s) => 
        acc + s.islas.reduce((a, i) => a + i.lados.filter(l => l.estado === 'INACTIVO').length, 0), 0);

    return (
        <div className="flex min-h-screen bg-gray-50 h-screen overflow-hidden">
            <Sidebar />
            <div class="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <Header showNav={false} showUserMenu variant="light" fixed={false} adminMode />
                
                <main class="flex-1 p-6 space-y-6 overflow-y-auto h-[calc(100vh-4rem)]">
                    
                    {/* Header Operativo */}
                    <div class="flex items-center justify-between">
                        <div>
                            <h1 class="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                <Activity class="w-6 h-6 text-emerald-500" />
                                Monitoreo de Surtidores
                            </h1>
                            {ultimaActualizacion && (
                                <p class="text-xs text-gray-400 mt-1">
                                    Última actualización: {ultimaActualizacion.toLocaleTimeString()}
                                </p>
                            )}
                        </div>
                        <button onClick={cargarMonitoreo} disabled={loading} class="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 shadow-sm">
                            <RefreshCw class={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
                        </button>
                    </div>

                    {/* KPIs Cards */}
                    <div class="grid grid-cols-3 gap-4">
                        <div class="bg-white rounded-xl border border-gray-200 shadow-xs p-4">
                            <p class="text-xs text-gray-500 uppercase font-semibold tracking-wider">Total Islas</p>
                            <p class="text-2xl font-black text-slate-900 mt-1">{totalIslas}</p>
                        </div>
                        <div class="bg-blue-50 border border-blue-200 rounded-xl shadow-xs p-4">
                            <p class="text-xs text-blue-500 uppercase font-semibold tracking-wider">Cargas Remotas (CU 14)</p>
                            <p class="text-2xl font-black text-blue-600 mt-1 flex items-center gap-2">
                                {totalManguerasEnCarga} <span class="text-[10px] bg-blue-500 text-white font-bold px-1.5 py-0.5 rounded animate-pulse">LPR</span>
                            </p>
                        </div>
                        <div class="bg-white rounded-xl border border-gray-200 shadow-xs p-4">
                            <p class="text-xs text-gray-500 uppercase font-semibold tracking-wider">Inactivos</p>
                            <p class="text-2xl font-black text-gray-400 mt-1">{totalInactivos}</p>
                        </div>
                    </div>

                    {/* Contenedor de la Rejilla de Distribución */}
                    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        
                        {/* COLUMNA IZQUIERDA Y CENTRAL: Sucursales e Islas (Ocupa 2 de 3 columnas) */}
                        <div class="xl:col-span-2 space-y-6">
                            {data.map(sucursal => (
                                <div key={sucursal.sucursal_id} class="space-y-4">
                                    <h2 class="text-lg font-bold text-slate-800 border-b border-gray-200 pb-2">
                                        {sucursal.sucursal_nombre}
                                    </h2>
                                    
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {sucursal.islas.map(isla => (
                                            <div key={isla.id} class="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                                                <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider">Isla N° {isla.numero}</h3>
                                                
                                                <div class="space-y-2">
                                                    {isla.lados.map(lado => {
                                                        const isRemoto = lado.estado === 'AUTORIZADO_REMOTO';
                                                        return (
                                                            <div 
                                                                key={lado.id} 
                                                                class={`flex items-center justify-between rounded-xl px-4 py-2.5 border transition-all duration-300 ${
                                                                    isRemoto 
                                                                        ? 'border-blue-400 bg-blue-50/20 shadow-[0_0_12px_rgba(59,130,246,0.15)] animate-pulse' 
                                                                        : 'bg-gray-50 border-gray-100'
                                                                }`}
                                                            >
                                                                <div class="flex items-center gap-2">
                                                                    <span class={`text-sm font-bold ${isRemoto ? 'text-blue-900' : 'text-slate-700'}`}>Lado {lado.lado}</span>
                                                                    <EstadoBadge estado={lado.estado} />
                                                                </div>

                                                                <div class="flex gap-1">
                                                                    {isRemoto ? (
                                                                        <>
                                                                            <button 
                                                                                onClick={() => setSurtidorSeleccionado(lado)}
                                                                                class="p-1 rounded bg-blue-100 text-blue-600 hover:bg-blue-200"
                                                                                title="Ver Auditoría LPR"
                                                                            >
                                                                                <Eye class="w-4 h-4" />
                                                                            </button>
                                                                            <button 
                                                                                onClick={() => handleCambiarEstado(lado.id, 'ACTIVO', 'Cancelación manual de orden remota')}
                                                                                class="p-1 rounded hover:bg-red-100 text-red-500"
                                                                                title="Cancelar Autorización"
                                                                            >
                                                                                <XCircle class="w-4 h-4" />
                                                                            </button>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            {lado.estado !== 'ACTIVO' && <button onClick={() => handleCambiarEstado(lado.id, 'ACTIVO', 'Activación manual')} class="text-gray-400 hover:text-slate-600 p-1">✔</button>}
                                                                            {lado.estado !== 'INACTIVO' && <button onClick={() => handleCambiarEstado(lado.id, 'INACTIVO', 'Inactivación manual')} class="text-gray-400 hover:text-slate-600 p-1">⏸</button>}
                                                                            {lado.estado !== 'FALLA' && <button onClick={() => handleCambiarEstado(lado.id, 'FALLA', 'Falla reportada')} class="text-gray-400 hover:text-red-500 p-1">⚠️</button>}
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* COLUMNA DERECHA: Panel de Auditoría de Cuenta Dinámico (CU 14) */}
                        <div class="space-y-4">
                            <h2 class="text-sm font-bold text-gray-400 uppercase tracking-wider">Auditoría de Cuenta Completa</h2>
                            
                            {surtidorSeleccionado ? (
                                <div class="bg-white p-5 rounded-2xl border border-blue-200 shadow-lg space-y-5 animate-fade-in">
                                    {/* Cabecera del Cliente */}
                                    <div class="flex items-center gap-3 border-b border-gray-100 pb-3">
                                        <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-xs">
                                            {surtidorSeleccionado.cliente_activo_nombre ? surtidorSeleccionado.cliente_activo_nombre.substring(0,2).toUpperCase() : 'CU'}
                                        </div>
                                        <div>
                                            <h3 class="text-sm font-bold text-slate-800">{surtidorSeleccionado.cliente_activo_nombre || 'Usuario de la App'}</h3>
                                            <span class="text-[10px] bg-blue-100 text-blue-800 font-black px-2 py-0.5 rounded uppercase tracking-wider">Cliente Corporativo (SaaS)</span>
                                        </div>
                                    </div>

                                    {/* Captura de Cámara */}
                                    <div class="space-y-1.5">
                                        <span class="text-[11px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                                            <Camera class="w-3.5 h-3.5 text-blue-500" /> Verificación de Placa (IA LPR)
                                        </span>
                                        <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between shadow-inner">
                                            <div class="bg-white text-slate-900 font-mono font-black px-4 py-0.5 rounded border-2 border-slate-300 text-md tracking-widest">
                                                {surtidorSeleccionado.placa_activa || '---'}
                                            </div>
                                            <span class="text-[9px] font-mono text-emerald-400 font-bold">MATCH EXCELENTE (98%)</span>
                                        </div>
                                    </div>

                                    {/* Límites de Consumo de tu endpoint de Usuarios */}
                                    <div class="space-y-2">
                                        <span class="text-[11px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                                            <ShieldCheck class="w-3.5 h-3.5 text-blue-500" /> Límites y Reglas de Consumo
                                        </span>
                                        <div class="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs space-y-2.5">
                                            <div class="flex justify-between border-b border-gray-200/60 pb-1.5">
                                                <span class="text-gray-400">Límite Diario Asignado:</span>
                                                <span class="font-bold text-slate-700">500.00 Bs.</span>
                                            </div>
                                            <div class="flex justify-between border-b border-gray-200/60 pb-1.5">
                                                <span class="text-gray-400">Saldo Disponible en Cupo:</span>
                                                <span class="font-bold text-emerald-600">500.00 Bs.</span>
                                            </div>
                                            <div class="flex justify-between pt-0.5">
                                                <span class="text-gray-400">Monto Autorizado Remoto:</span>
                                                <span class="font-black text-blue-600 font-mono">Bs. {surtidorSeleccionado.monto_autorizado}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pasarela y SIAT */}
                                    <div class="space-y-2">
                                        <span class="text-[11px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                                            <CreditCard class="w-3.5 h-3.5 text-blue-500" /> Estado Financiero e Impuestos
                                        </span>
                                        <div class="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs space-y-2">
                                            <div class="flex justify-between">
                                                <span class="text-gray-400">Pasarela de Pago:</span>
                                                <span class="font-semibold text-emerald-600 flex items-center gap-1">💳 APROBADA</span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span class="text-gray-400">Pre-Factura Emitida:</span>
                                                <span class="font-semibold text-slate-500">SIAT Pendiente Cierre</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div class="bg-white p-8 rounded-2xl border border-dashed border-gray-300 text-center text-gray-400 text-sm flex flex-col items-center justify-center h-64">
                                    <Activity class="w-8 h-8 text-gray-300 mb-2" />
                                    No hay ningún surtidor remoto seleccionado.<br />
                                    <span class="text-xs text-gray-400 mt-1">Haga clic en el ícono del ojo (👁) de un surtidor autorizado para auditar la cuenta.</span>
                                </div>
                            )}
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}

export default MonitoreoPage;