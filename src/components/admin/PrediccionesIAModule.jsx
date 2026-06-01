import { useEffect, useMemo, useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { clientesService, prediccionesIAService } from '../../services/api';
import { tiposCombustibleService } from '../../services/ventasService';

function PrediccionesIAModule() {
  const [clientes, setClientes] = useState([]);
  const [combustibles, setCombustibles] = useState([]);
  const [loadingInit, setLoadingInit] = useState(false);
  const [loadingPrediccion, setLoadingPrediccion] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);

  const [modo, setModo] = useState('cliente'); // 'cliente' | 'estacion'
  const [form, setForm] = useState({
    cliente_id: '',
    tipo_combustible_id: '',
    tipo_periodo: 'DIARIO',
    unidad: 'MONTO',
    dias: 7,
  });

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    setLoadingInit(true);
    try {
      const [clientesRes, combRes] = await Promise.all([
        clientesService.getAll(),
        tiposCombustibleService.getAll(),
      ]);
      const cData = Array.isArray(clientesRes.data) ? clientesRes.data : clientesRes.data.results || [];
      const tData = Array.isArray(combRes.data) ? combRes.data : combRes.data.results || [];
      setClientes(cData);
      setCombustibles(tData);
    } catch (err) {
      console.error(err);
      setError('Error al cargar datos iniciales.');
    } finally {
      setLoadingInit(false);
    }
  };

  const clientePrediccion = useMemo(
    () => clientes.find((c) => String(c.id) === String(resultado?.cliente_id)),
    [clientes, resultado?.cliente_id]
  );

  const combustiblePrediccion = useMemo(
    () => combustibles.find((c) => String(c.id) === String(resultado?.tipo_combustible_id)),
    [combustibles, resultado?.tipo_combustible_id]
  );

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setResultado(null);
    setError('');
  };

  const handleModoChange = (nuevoModo) => {
    setModo(nuevoModo);
    setResultado(null);
    setError('');
    setForm((prev) => ({ ...prev, cliente_id: '', tipo_combustible_id: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (modo === 'cliente' && !form.cliente_id) {
      setError('Selecciona un cliente.');
      return;
    }

    setLoadingPrediccion(true);
    setError('');
    try {
      const payload = {
        tipo_periodo: form.tipo_periodo,
        unidad: form.unidad,
        dias: Number(form.dias),
      };
      if (modo === 'cliente' && form.cliente_id) {
        payload.cliente_id = Number(form.cliente_id);
      }
      if (form.tipo_combustible_id) {
        payload.tipo_combustible_id = Number(form.tipo_combustible_id);
      }

      const response = await prediccionesIAService.predecir(payload);
      setResultado(response.data);
    } catch (err) {
      console.error(err);
      setResultado(null);
      const detail = err.response?.data?.detail || err.response?.data?.cliente_id?.[0] || 'No se pudo generar la predicción.';
      setError(detail);
    } finally {
      setLoadingPrediccion(false);
    }
  };

  const unidadLabel = form.unidad === 'MONTO' ? 'Bs' : 'L';

  const maxPrediccion = useMemo(() => {
    if (!resultado?.predicciones) return 0;
    return Math.max(...resultado.predicciones.map((p) => p.valor_estimado), 1);
  }, [resultado]);

  const maxHistorial = useMemo(() => {
    if (!resultado?.historial_reciente) return 0;
    return Math.max(...resultado.historial_reciente.map((h) => h.valor), 1);
  }, [resultado]);

  const maxGrafico = Math.max(maxPrediccion, maxHistorial, 1);

  const tendenciaInfo = useMemo(() => {
    const t = resultado?.resumen?.tendencia;
    if (t === 'subiendo') return { texto: 'Al alza', color: 'text-red-600', bg: 'bg-red-50', icono: '↑' };
    if (t === 'bajando') return { texto: 'A la baja', color: 'text-emerald-600', bg: 'bg-emerald-50', icono: '↓' };
    return { texto: 'Estable', color: 'text-blue-600', bg: 'bg-blue-50', icono: '→' };
  }, [resultado]);

  const tituloResultado = useMemo(() => {
    if (!resultado) return '';
    if (resultado.modo === 'cliente') {
      return clientePrediccion?.nombre || `Cliente ID ${resultado.cliente_id}`;
    }
    if (resultado.modo === 'combustible') {
      const nombre = combustiblePrediccion?.tipo?.replace(/_/g, ' ') || `Combustible ID ${resultado.tipo_combustible_id}`;
      return `Demanda de ${nombre}`;
    }
    return 'Demanda general de la estación';
  }, [resultado, clientePrediccion, combustiblePrediccion]);

  const turnosOrden = ['MANANA', 'TARDE', 'NOCHE'];
  const turnosLabels = { MANANA: 'Mañana', TARDE: 'Tarde', NOCHE: 'Noche' };
  const turnosHorarios = { MANANA: '06:00 - 14:00', TARDE: '14:00 - 22:00', NOCHE: '22:00 - 06:00' };
  const turnosIconos = { MANANA: '☀️', TARDE: '🌅', NOCHE: '🌙' };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Predicciones de Consumo (IA)</h2>

      {/* Selector de modo */}
      <div className="flex gap-2">
        <button
          onClick={() => handleModoChange('cliente')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            modo === 'cliente'
              ? 'bg-emerald-500 text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Por cliente
        </button>
        <button
          onClick={() => handleModoChange('estacion')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            modo === 'estacion'
              ? 'bg-emerald-500 text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Demanda general
        </button>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <form onSubmit={handleSubmit} className="grid md:grid-cols-4 gap-4 items-end">
          {modo === 'cliente' ? (
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Cliente</label>
              <select
                value={form.cliente_id}
                onChange={(e) => handleFormChange('cliente_id', e.target.value)}
                className="block w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              >
                <option value="">Selecciona un cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.email || c.nit || `ID ${c.id}`})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Tipo de combustible</label>
              <select
                value={form.tipo_combustible_id}
                onChange={(e) => handleFormChange('tipo_combustible_id', e.target.value)}
                className="block w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Todos los combustibles</option>
                {combustibles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.tipo?.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Periodo</label>
            <select
              value={form.tipo_periodo}
              onChange={(e) => handleFormChange('tipo_periodo', e.target.value)}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="DIARIO">Diario</option>
              <option value="SEMANAL">Semanal</option>
              <option value="MENSUAL">Mensual</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Unidad</label>
            <select
              value={form.unidad}
              onChange={(e) => handleFormChange('unidad', e.target.value)}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="MONTO">Monto (Bs)</option>
              <option value="LITROS">Litros</option>
            </select>
          </div>

          <Input
            label="Días a predecir"
            type="number"
            min="1"
            max="31"
            value={form.dias}
            onChange={(e) => handleFormChange('dias', e.target.value)}
            required
          />

          <div className="md:col-span-4 flex gap-3">
            <Button type="submit" disabled={loadingPrediccion || loadingInit}>
              {loadingPrediccion ? 'Generando...' : 'Generar Predicción'}
            </Button>
            <Button
              type="button"
              className="!bg-gray-200 !text-gray-700 hover:!bg-gray-300"
              onClick={() => {
                setResultado(null);
                setError('');
                setForm({ cliente_id: '', tipo_combustible_id: '', tipo_periodo: 'DIARIO', unidad: 'MONTO', dias: 7 });
              }}
            >
              Limpiar
            </Button>
          </div>
        </form>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {loadingInit && <p className="mt-3 text-sm text-gray-500">Cargando datos...</p>}
      </div>

      {/* Resultados */}
      {resultado && (
        <>
          {/* Advertencia */}
          {resultado.advertencia && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
              <p className="text-sm text-amber-800 font-medium">{resultado.advertencia}</p>
            </div>
          )}

          {/* Cards resumen */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Total estimado</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {resultado.resumen?.total_estimado?.toFixed(2)} <span className="text-base font-normal text-gray-500">{unidadLabel}</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">Próximos {resultado.horizonte_dias} días</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                Promedio por {resultado.resumen?.etiqueta_periodo || 'día'}
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {resultado.resumen?.promedio_por_periodo?.toFixed(2) || resultado.resumen?.promedio_diario?.toFixed(2)} <span className="text-base font-normal text-gray-500">{unidadLabel}</span>
              </p>
            </div>
            <div className={`rounded-xl shadow-sm border border-gray-200 p-5 ${tendenciaInfo.bg}`}>
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Tendencia</p>
              <p className={`text-2xl font-bold mt-1 ${tendenciaInfo.color}`}>
                {tendenciaInfo.icono} {tendenciaInfo.texto}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Datos históricos</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {resultado.resumen?.dias_con_datos || 0} <span className="text-base font-normal text-gray-500">días</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">Modelo: {resultado.modelo}</p>
            </div>
          </div>

          {/* Desglose por turnos */}
          {resultado.desglose_turnos && (
            <div className="grid sm:grid-cols-3 gap-4">
              {turnosOrden.map((turno) => {
                const data = resultado.desglose_turnos[turno] || { total: 0, promedio_diario: 0 };
                return (
                  <div key={turno} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{turnosIconos[turno]}</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{turnosLabels[turno]}</p>
                        <p className="text-xs text-gray-400">{turnosHorarios[turno]}</p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">
                      {data.promedio_diario.toFixed(2)} <span className="text-sm font-normal text-gray-500">{unidadLabel}/día</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Total histórico: {data.total.toFixed(2)} {unidadLabel}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Gráfico visual */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">{tituloResultado}</h3>
            <p className="text-sm text-gray-500 mb-4">
              Historial reciente y predicción a {resultado.horizonte_dias} días
            </p>

            <div className="flex items-end gap-[2px] h-48 overflow-x-auto pb-2">
              {/* Barras historial */}
              {(resultado.historial_reciente || []).map((h) => {
                const pct = maxGrafico > 0 ? (h.valor / maxGrafico) * 100 : 0;
                return (
                  <div key={`h-${h.fecha}`} className="flex flex-col items-center flex-shrink-0" style={{ width: '24px' }}>
                    <div className="w-full flex items-end" style={{ height: '160px' }}>
                      <div
                        className="w-full bg-gray-300 rounded-t transition-all"
                        style={{ height: `${Math.max(pct, 2)}%` }}
                        title={`${h.fecha}: ${h.valor.toFixed(2)} ${unidadLabel}`}
                      />
                    </div>
                    <span className="text-[9px] text-gray-400 mt-1 rotate-[-45deg] origin-top-left whitespace-nowrap">
                      {h.fecha.slice(5)}
                    </span>
                  </div>
                );
              })}

              {/* Separador Hoy */}
              <div className="flex-shrink-0 w-[2px] bg-slate-900 mx-1 self-stretch rounded" />

              {/* Barras predicción */}
              {(resultado.predicciones || []).map((p) => {
                const pct = maxGrafico > 0 ? (p.valor_estimado / maxGrafico) * 100 : 0;
                return (
                  <div key={`p-${p.fecha}`} className="flex flex-col items-center flex-shrink-0" style={{ width: '24px' }}>
                    <div className="w-full flex items-end" style={{ height: '160px' }}>
                      <div
                        className="w-full bg-emerald-500 rounded-t transition-all"
                        style={{ height: `${Math.max(pct, 2)}%` }}
                        title={`${p.fecha}: ${p.valor_estimado.toFixed(2)} ${unidadLabel} (predicción)`}
                      />
                    </div>
                    <span className="text-[9px] text-emerald-600 mt-1 rotate-[-45deg] origin-top-left whitespace-nowrap">
                      {p.fecha.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-6 mt-4 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-300" />
                <span>Historial real</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span>Predicción</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-[2px] h-3 bg-slate-900 rounded" />
                <span>Hoy</span>
              </div>
            </div>
          </div>

          {/* Tabla detalle */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-slate-900">Detalle por día</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fecha</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Valor estimado</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Indicador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(resultado.predicciones || []).map((item) => {
                    const pct = maxPrediccion > 0 ? (item.valor_estimado / maxPrediccion) * 100 : 0;
                    return (
                      <tr key={item.fecha} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-700">{item.fecha}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          {item.valor_estimado.toFixed(2)} {unidadLabel}
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-full max-w-xs h-2 bg-gray-200 rounded">
                            <div
                              className="h-2 bg-emerald-500 rounded"
                              style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default PrediccionesIAModule;
