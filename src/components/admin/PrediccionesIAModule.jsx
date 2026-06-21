import { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { prediccionesIAService, clientesService } from '../../services/api';
import { sucursalesService } from '../../services/sucursalesService';
import apiClient from '../../services/api';

function PrediccionesIAModule() {
  const [modo, setModo] = useState('cliente'); // 'cliente' | 'sucursal'
  const [loadingPrediccion, setLoadingPrediccion] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);

  // Estado modo cliente
  const [busqueda, setBusqueda] = useState('');
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [showSugerencias, setShowSugerencias] = useState(false);
  const [loadingBusqueda, setLoadingBusqueda] = useState(false);
  const [clienteNombre, setClienteNombre] = useState('');

  // Estado modo sucursal
  const [sucursales, setSucursales] = useState([]);
  const [tiposCombustible, setTiposCombustible] = useState([]);
  const [loadingSucursales, setLoadingSucursales] = useState(false);

  const [form, setForm] = useState({
    cliente_id: '',
    tipo_periodo: 'DIARIO',
    unidad: 'MONTO',
    dias: 7,
    sucursal_id: '',
    tipo_combustible_id: '',
  });

  const cargarSucursales = async () => {
    if (sucursales.length > 0) return;
    setLoadingSucursales(true);
    try {
      const [sucRes, tiposRes] = await Promise.all([
        sucursalesService.getAll(),
        apiClient.get('/tipos-combustible/'),
      ]);
      setSucursales(Array.isArray(sucRes.data) ? sucRes.data : sucRes.data.results || []);
      setTiposCombustible(Array.isArray(tiposRes.data) ? tiposRes.data : tiposRes.data.results || []);
    } catch {
      setError('Error al cargar sucursales');
    } finally {
      setLoadingSucursales(false);
    }
  };

  const handleModo = (nuevoModo) => {
    setModo(nuevoModo);
    setResultado(null);
    setError('');
    if (nuevoModo === 'sucursal') cargarSucursales();
  };

  const buscarClientes = async (texto) => {
    setBusqueda(texto);
    setShowSugerencias(true);
    if (texto.length < 2) { setClientesFiltrados([]); return; }
    setLoadingBusqueda(true);
    try {
      const res = await apiClient.get('/clientes-ventas/', { params: { search: texto } });
      setClientesFiltrados(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch {
      setClientesFiltrados([]);
    } finally {
      setLoadingBusqueda(false);
    }
  };

  const seleccionarCliente = (cliente) => {
    setBusqueda(cliente.nombre);
    setClienteNombre(cliente.nombre);
    setShowSugerencias(false);
    setForm(prev => ({ ...prev, cliente_id: cliente.id }));
    setResultado(null);
  };

  const handleFormChange = (field, value) => {
    let newForm = { ...form, [field]: value };
    if (field === 'tipo_periodo') {
        if (value === 'DIARIO') newForm.dias = 7;
        if (value === 'SEMANAL') newForm.dias = 28;
        if (value === 'MENSUAL') newForm.dias = 90;
    }
    setForm(newForm);
    setResultado(null);
    setError('');
};
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingPrediccion(true);
    setError('');
    try {
      let response;
      if (modo === 'cliente') {
        if (!form.cliente_id) { setError('Selecciona un cliente.'); return; }
        response = await prediccionesIAService.predecir({
          cliente_id: Number(form.cliente_id),
          tipo_periodo: form.tipo_periodo,
          unidad: form.unidad,
          dias: Number(form.dias),
        });
      } else {
        if (!form.sucursal_id || !form.tipo_combustible_id) {
          setError('Selecciona sucursal y tipo de combustible.');
          return;
        }
        response = await apiClient.post('/predicciones-sucursal/', {
          sucursal_id: Number(form.sucursal_id),
          tipo_combustible_id: Number(form.tipo_combustible_id),
          dias: Number(form.dias),
        });
      }
      setResultado(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo generar la predicción.');
    } finally {
      setLoadingPrediccion(false);
    }
  };
const agruparPredicciones = (predicciones, periodo) => {
    if (periodo === 'DIARIO') return predicciones;

    if (periodo === 'SEMANAL') {
        // Si hay menos de 7 días mostrar por día igual
        if (predicciones.length < 7) return predicciones;
        const semanas = [];
        for (let i = 0; i < predicciones.length; i += 7) {
            const grupo = predicciones.slice(i, i + 7);
            const totalLitros = grupo.reduce((acc, p) => acc + p.litros_estimados, 0);
            const totalValor = grupo.reduce((acc, p) => acc + (p.valor_estimado || p.monto_estimado || 0), 0);
            semanas.push({
                fecha: `Semana ${Math.floor(i / 7) + 1} (${grupo[0].fecha} al ${grupo[grupo.length - 1].fecha})`,
                litros_estimados: Math.round(totalLitros * 100) / 100,
                valor_estimado: Math.round(totalValor * 100) / 100,
                monto_estimado: Math.round(totalValor * 100) / 100,
            });
        }
        return semanas;
    }

    if (periodo === 'MENSUAL') {
        // Si hay menos de 28 días mostrar por día igual
        if (predicciones.length < 28) return predicciones;
        const meses = {};
        predicciones.forEach(p => {
            const mes = p.fecha.substring(0, 7);
            if (!meses[mes]) meses[mes] = { litros: 0, valor: 0 };
            meses[mes].litros += p.litros_estimados;
            meses[mes].valor += p.valor_estimado || p.monto_estimado || 0;
        });
        return Object.entries(meses).map(([mes, data]) => ({
            fecha: mes,
            litros_estimados: Math.round(data.litros * 100) / 100,
            valor_estimado: Math.round(data.valor * 100) / 100,
            monto_estimado: Math.round(data.valor * 100) / 100,
        }));
    }

    return predicciones;
};
  const handleLimpiar = () => {
    setResultado(null);
    setError('');
    setBusqueda('');
    setClienteNombre('');
    setClientesFiltrados([]);
    setForm({ cliente_id: '', tipo_periodo: 'DIARIO', unidad: 'MONTO', dias: 7, sucursal_id: '', tipo_combustible_id: '' });
  };

  const sucursalNombre = sucursales.find(s => String(s.id) === String(form.sucursal_id))?.nombre || '';
  const tipoNombre = tiposCombustible.find(t => String(t.id) === String(form.tipo_combustible_id))?.tipo?.replace(/_/g, ' ') || '';

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Predicciones de Consumo (IA)</h2>

      {/* Selector de modo */}
      <div className="flex gap-2">
        <button
          onClick={() => handleModo('cliente')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            modo === 'cliente'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Por cliente
        </button>
        <button
          onClick={() => handleModo('sucursal')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            modo === 'sucursal'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Por sucursal
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <form onSubmit={handleSubmit} className="grid md:grid-cols-4 gap-4 items-end">

          {modo === 'cliente' ? (
            <>
              {/* Autocomplete cliente */}
              <div className="relative">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Cliente</label>
                <input
                  type="text"
                  value={busqueda}
                  onChange={e => buscarClientes(e.target.value)}
                  onFocus={() => busqueda.length >= 2 && setShowSugerencias(true)}
                  onBlur={() => setTimeout(() => setShowSugerencias(false), 200)}
                  placeholder="Buscar por nombre o carnet..."
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                {loadingBusqueda && <p className="text-xs text-gray-400 mt-1">Buscando...</p>}
                {showSugerencias && clientesFiltrados.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                    {clientesFiltrados.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onMouseDown={() => seleccionarCliente(c)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0"
                      >
                        <span className="font-medium">{c.nombre}</span>
                        {c.nit && <span className="text-gray-400 ml-2 text-xs">CI: {c.nit}</span>}
                      </button>
                    ))}
                  </div>
                )}
                {showSugerencias && busqueda.length >= 2 && clientesFiltrados.length === 0 && !loadingBusqueda && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 px-4 py-3 text-sm text-gray-400">
                    No se encontraron clientes
                  </div>
                )}
              </div>

              {/* Periodo */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Periodo</label>
                <select value={form.tipo_periodo} onChange={e => handleFormChange('tipo_periodo', e.target.value)} className="block w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="DIARIO">Diario</option>
                  <option value="SEMANAL">Semanal</option>
                  <option value="MENSUAL">Mensual</option>
                </select>
              </div>

              {/* Unidad */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Unidad</label>
                <select value={form.unidad} onChange={e => handleFormChange('unidad', e.target.value)} className="block w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="MONTO">Monto (Bs.)</option>
                  <option value="LITROS">Litros</option>
                </select>
              </div>
            </>
          ) : (
            <>
              {/* Sucursal */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Sucursal</label>
                <select value={form.sucursal_id} onChange={e => handleFormChange('sucursal_id', e.target.value)} className="block w-full border border-gray-300 rounded-lg px-3 py-2" required>
                  <option value="">Selecciona una sucursal</option>
                  {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>

              {/* Tipo combustible */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Tipo de combustible</label>
                <select value={form.tipo_combustible_id} onChange={e => handleFormChange('tipo_combustible_id', e.target.value)} className="block w-full border border-gray-300 rounded-lg px-3 py-2" required>
                  <option value="">Selecciona un tipo</option>
                  {tiposCombustible.map(t => <option key={t.id} value={t.id}>{t.tipo.replace(/_/g, ' ')}</option>)}
                </select>
              </div>

              <div></div>
            </>
          )}

          {/* Días siempre visible */}
          <Input
            label="Días"
            type="number"
            min="1"
            max="90"
            value={form.dias}
            onChange={e => handleFormChange('dias', e.target.value)}
            required
          />

          <div className="md:col-span-4 flex gap-3">
            <Button type="submit" disabled={loadingPrediccion}>
              {loadingPrediccion ? 'Generando...' : 'Generar Predicción'}
            </Button>
            <Button type="button" className="!bg-gray-200 !text-gray-700 hover:!bg-gray-300" onClick={handleLimpiar}>
              Limpiar
            </Button>
          </div>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {/* Resultado */}
      {resultado && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-slate-900">Resultado de predicción</h3>
            <p className="text-sm text-gray-600">
              {modo === 'cliente'
                ? `Cliente: ${clienteNombre || `ID ${resultado.cliente_id}`}`
                : `Sucursal: ${sucursalNombre} | Combustible: ${tipoNombre}`
              } | Modelo: {resultado.modelo}
            </p>
          </div>

          <div className="p-5 grid sm:grid-cols-2 gap-4 border-b border-gray-200">
            {modo === 'cliente' ? (
              <>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Total estimado</p>
                  <p className="text-xl font-bold text-slate-900">
                    {form.unidad === 'MONTO' ? `Bs. ${resultado.resumen?.total_estimado}` : `${resultado.resumen?.total_estimado} Lt`}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Promedio diario</p>
                  <p className="text-xl font-bold text-slate-900">
                    {form.unidad === 'MONTO' ? `Bs. ${resultado.resumen?.promedio_diario}` : `${resultado.resumen?.promedio_diario} Lt`}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Total litros estimado</p>
                  <p className="text-xl font-bold text-slate-900">{resultado.resumen?.total_litros_estimado} Lt</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Promedio diario</p>
                  <p className="text-xl font-bold text-slate-900">{resultado.resumen?.promedio_diario_litros} Lt</p>
                </div>
              </>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fecha</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Litros estimados</th>
                  {modo === 'cliente' && <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Valor estimado</th>}
                  {modo === 'sucursal' && <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Monto estimado</th>}
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Indicador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(agruparPredicciones(resultado.predicciones || [], form.tipo_periodo)).map((item, idx) => (
    <tr key={idx} className="hover:bg-gray-50">
        <td className="px-4 py-3 text-sm text-gray-700">{item.fecha}</td>
        <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.litros_estimados} Lt</td>
        {modo === 'cliente' && (
            <td className="px-4 py-3 text-sm text-slate-900">
                {form.unidad === 'MONTO' ? `Bs. ${item.valor_estimado}` : `${item.valor_estimado} Lt`}
            </td>
        )}
        {modo === 'sucursal' && (
            <td className="px-4 py-3 text-sm text-slate-900">Bs. {item.monto_estimado}</td>
        )}
        <td className="px-4 py-3">
            <div className="w-full max-w-xs h-2 bg-gray-200 rounded">
                <div
                    className="h-2 bg-emerald-500 rounded"
                    style={{
                        width: `${Math.min(100, Math.max(5, (item.litros_estimados / (resultado.resumen?.total_litros_estimado || resultado.resumen?.total_estimado || 1)) * 100))}%`,
                    }}
                />
            </div>
        </td>
    </tr>
))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default PrediccionesIAModule;