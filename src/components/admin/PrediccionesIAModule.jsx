import { useEffect, useMemo, useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { clientesService, prediccionesIAService } from '../../services/api';

function PrediccionesIAModule() {
  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [loadingPrediccion, setLoadingPrediccion] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);
  const [form, setForm] = useState({
    cliente_id: '',
    tipo_periodo: 'DIARIO',
    unidad: 'MONTO',
    dias: 7,
  });

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    setLoadingClientes(true);
    setError('');
    try {
      const response = await clientesService.getAll();
      const clientesData = Array.isArray(response.data) ? response.data : response.data.results || [];
      setClientes(clientesData);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los clientes.');
      setClientes([]);
    } finally {
      setLoadingClientes(false);
    }
  };

  const clienteSeleccionado = useMemo(
    () => clientes.find((c) => String(c.id) === String(form.cliente_id)),
    [clientes, form.cliente_id]
  );

  const clientePrediccion = useMemo(
    () => clientes.find((c) => String(c.id) === String(resultado?.cliente_id)),
    [clientes, resultado?.cliente_id]
  );

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Evita mostrar predicciones desactualizadas al cambiar filtros.
    setResultado(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.cliente_id) {
      setError('Selecciona un cliente para generar la predicción.');
      return;
    }

    setLoadingPrediccion(true);
    setError('');
    try {
      const payload = {
        cliente_id: Number(form.cliente_id),
        tipo_periodo: form.tipo_periodo,
        unidad: form.unidad,
        dias: Number(form.dias),
      };
      const response = await prediccionesIAService.predecir(payload);
      setResultado(response.data);
    } catch (err) {
      console.error(err);
      setResultado(null);
      setError(err.response?.data?.detail || 'No se pudo generar la predicción.');
    } finally {
      setLoadingPrediccion(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Predicciones de Consumo (IA)</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <form onSubmit={handleSubmit} className="grid md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Cliente</label>
            <select
              value={form.cliente_id}
              onChange={(e) => handleFormChange('cliente_id', e.target.value)}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            >
              <option value="">Selecciona un cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre} ({cliente.email})
                </option>
              ))}
            </select>
          </div>

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
              <option value="MONTO">Monto</option>
              <option value="LITROS">Litros</option>
            </select>
          </div>

          <Input
            label="Días"
            type="number"
            min="1"
            max="31"
            value={form.dias}
            onChange={(e) => handleFormChange('dias', e.target.value)}
            required
          />

          <div className="md:col-span-4 flex gap-3">
            <Button type="submit" disabled={loadingPrediccion || loadingClientes}>
              {loadingPrediccion ? 'Generando...' : 'Generar Predicción'}
            </Button>
            <Button
              type="button"
              className="!bg-gray-200 !text-gray-700 hover:!bg-gray-300"
              onClick={() => {
                setResultado(null);
                setError('');
                setForm({ cliente_id: '', tipo_periodo: 'DIARIO', unidad: 'MONTO', dias: 7 });
              }}
            >
              Limpiar
            </Button>
          </div>
        </form>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {loadingClientes && <p className="mt-3 text-sm text-gray-500">Cargando clientes...</p>}
      </div>

      {resultado && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-slate-900">Resultado de predicción</h3>
            <p className="text-sm text-gray-600">
              Cliente: {clientePrediccion?.nombre || `ID ${resultado.cliente_id}`} | Modelo: {resultado.modelo}
            </p>
            {resultado.advertencia && (
              <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                {resultado.advertencia}
              </p>
            )}
          </div>

          <div className="p-5 grid sm:grid-cols-2 gap-4 border-b border-gray-200">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Total estimado</p>
              <p className="text-xl font-bold text-slate-900">
                {resultado.resumen?.total_estimado} {resultado.unidad}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Promedio diario</p>
              <p className="text-xl font-bold text-slate-900">
                {resultado.resumen?.promedio_diario} {resultado.unidad}
              </p>
            </div>
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
                {(resultado.predicciones || []).map((item) => (
                  <tr key={item.fecha} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">{item.fecha}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {item.valor_estimado} {item.unidad}
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-full max-w-xs h-2 bg-gray-200 rounded">
                        <div
                          className="h-2 bg-emerald-500 rounded"
                          style={{
                            width: `${Math.min(100, Math.max(5, (item.valor_estimado / (resultado.resumen?.total_estimado || 1)) * 100))}%`,
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
