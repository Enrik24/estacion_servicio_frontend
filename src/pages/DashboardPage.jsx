import { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, RefreshCw, DollarSign, Droplets, TrendingUp, Calculator } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import KpiCard from '../components/dashboard/KpiCard';
import DateRangeFilter from '../components/dashboard/DateRangeFilter';
import VentasPorTurnoChart from '../components/dashboard/VentasPorTurnoChart';
import MetodosPagoChart from '../components/dashboard/MetodosPagoChart';
import RendimientoSurtidoresChart from '../components/dashboard/RendimientoSurtidoresChart';
import EstadoSurtidoresWidget from '../components/dashboard/EstadoSurtidoresWidget';
import { dashboardService } from '../services/dashboardService';

/**
 * Formatea una fecha Date a string YYYY-MM-DD.
 */
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calcula las fechas para los filtros rápidos.
 * @param {string} tipo - 'hoy' | 'semana' | 'mes'
 */
function calcularRangoRapido(tipo) {
  const hoy = new Date();
  let inicio;

  switch (tipo) {
    case 'hoy':
      inicio = new Date(hoy);
      break;
    case 'semana': {
      inicio = new Date(hoy);
      const dia = inicio.getDay();
      // Lunes = 1, así que retrocedemos al lunes de esta semana
      const diff = dia === 0 ? 6 : dia - 1;
      inicio.setDate(inicio.getDate() - diff);
      break;
    }
    case 'mes':
      inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      break;
    default:
      inicio = new Date(hoy);
  }

  return {
    fechaInicio: formatDate(inicio),
    fechaFin: formatDate(hoy),
  };
}

function DashboardPage() {
  // Estado de datos
  const [kpiData, setKpiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  // Estado de filtros de fecha - por defecto: este mes
  const defaultRange = calcularRangoRapido('mes');
  const [fechaInicio, setFechaInicio] = useState(defaultRange.fechaInicio);
  const [fechaFin, setFechaFin] = useState(defaultRange.fechaFin);

  /**
   * Carga los KPIs del backend.
   */
  const cargarKPIs = useCallback(async (inicio, fin) => {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardService.getKPIs(inicio, fin);
      setKpiData(response.data);
      setUltimaActualizacion(new Date());
    } catch (err) {
      console.error('Error cargando dashboard KPIs:', err);
      setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Error al cargar los datos del dashboard. Verifique su conexión.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial y auto-refresh cada 60 segundos
  useEffect(() => {
    cargarKPIs(fechaInicio, fechaFin);

    const interval = setInterval(() => {
      if (!document.hidden) {
        cargarKPIs(fechaInicio, fechaFin);
      }
    }, 60000); // 1 minuto

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        cargarKPIs(fechaInicio, fechaFin);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fechaInicio, fechaFin, cargarKPIs]);

  /**
   * Maneja los filtros rápidos de fecha.
   */
  const handleQuickFilter = (tipo) => {
    const { fechaInicio: inicio, fechaFin: fin } = calcularRangoRapido(tipo);
    setFechaInicio(inicio);
    setFechaFin(fin);
  };

  // Extraer datos del response
  const kpis = kpiData?.kpis_principales || {};
  const ventasPorTurno = kpiData?.ventas_por_turno || [];
  const metodosPago = kpiData?.metodos_pago || [];
  const rendimientoSurtidores = kpiData?.rendimiento_surtidores || [];
  const estadoSurtidores = kpiData?.estado_surtidores || {};

  // Determinar info de rol del usuario
  const userStr = localStorage.getItem('user');
  const userData = userStr ? JSON.parse(userStr) : {};
  const userRole = userData?.roles_detalle?.[0]?.nombre || '';
  const sucursalNombre = userData?.sucursal_nombre || '';

  return (
    <div className="flex min-h-screen bg-gray-50 h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header showNav={false} showUserMenu variant="light" fixed={false} adminMode />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto h-[calc(100vh-4rem)]">

          {/* Header con título y controles */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <LayoutDashboard className="w-6 h-6 text-emerald-500" />
                Dashboard Ejecutivo
              </h1>
              <p className="text-xs text-gray-400 mt-1">
                {userRole.toLowerCase() === 'gerente' && sucursalNombre
                  ? `Datos de: ${sucursalNombre}`
                  : 'Datos consolidados de todas las sucursales'
                }
                {ultimaActualizacion && (
                  <span className="ml-2">
                    • Actualizado: {ultimaActualizacion.toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <DateRangeFilter
                fechaInicio={fechaInicio}
                fechaFin={fechaFin}
                onFechaInicioChange={setFechaInicio}
                onFechaFinChange={setFechaFin}
                onQuickFilter={handleQuickFilter}
              />
              <button
                onClick={() => cargarKPIs(fechaInicio, fechaFin)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 shadow-sm transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>
          </div>

          {/* Estado de error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center gap-2">
              <span className="font-bold">⚠️</span>
              {error}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && !kpiData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                    <div className="h-3 bg-gray-200 rounded w-24 mb-3" />
                    <div className="h-7 bg-gray-200 rounded w-32 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-20" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-72 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-40 mb-6" />
                    <div className="h-48 bg-gray-100 rounded-xl" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contenido principal */}
          {kpiData && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                  title="Ventas Totales"
                  value={`Bs. ${Number(kpis.ventas_totales_bs || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}`}
                  subtitle="Monto total del periodo"
                  icon={DollarSign}
                  color="emerald"
                  index={0}
                />
                <KpiCard
                  title="Litros Vendidos"
                  value={Number(kpis.litros_vendidos || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  subtitle="Litros despachados"
                  icon={Droplets}
                  color="blue"
                  index={1}
                />
                <KpiCard
                  title="Margen de Ganancia"
                  value={`Bs. ${Number(kpis.margen_ganancia_bs || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}`}
                  subtitle="Venta menos costo"
                  icon={TrendingUp}
                  color="amber"
                  index={2}
                />
                <KpiCard
                  title="Prom. Litros/Venta"
                  value={Number(kpis.promedio_litros_por_venta || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  subtitle="Litros promedio por transacción"
                  icon={Calculator}
                  color="violet"
                  index={3}
                />
              </div>

              {/* Fila de gráficos: Turnos + Métodos de Pago */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <VentasPorTurnoChart data={ventasPorTurno} />
                <MetodosPagoChart data={metodosPago} />
              </div>

              {/* Fila de gráficos: Rendimiento + Estado */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RendimientoSurtidoresChart data={rendimientoSurtidores} />
                <EstadoSurtidoresWidget data={estadoSurtidores} />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default DashboardPage;
