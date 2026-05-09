import { useEffect, useMemo, useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { clientesService, limitesConsumoService } from '../../services/api';

const LIMITE_FORM_INICIAL = {
  cliente_id: '',
  limite_diario: '',
  limite_mensual: '',
};

function formatearBs(valor) {
  const numero = Number(valor || 0);
  return `Bs ${numero.toFixed(2)}`;
}

function ClientesLimitesModule() {
  const [clientes, setClientes] = useState([]);
  const [limites, setLimites] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [formData, setFormData] = useState(LIMITE_FORM_INICIAL);
  const [loading, setLoading] = useState(false);
  const [consumoModal, setConsumoModal] = useState({
    open: false,
    loading: false,
    clienteNombre: '',
    resumen: null,
    error: '',
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [clientesRes, limitesRes] = await Promise.all([
        clientesService.getAll(),
        limitesConsumoService.getAll(),
      ]);
      const clientesData = Array.isArray(clientesRes.data) ? clientesRes.data : clientesRes.data.results || [];
      setClientes(clientesData);
      setLimites(Array.isArray(limitesRes.data) ? limitesRes.data : limitesRes.data.results || []);
    } catch (error) {
      alert(`Error al cargar clientes/límites: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const limitesPorCliente = useMemo(() => {
    const mapa = {};
    limites.forEach((limite) => {
      if (!mapa[limite.cliente]) {
        mapa[limite.cliente] = {};
      }
      mapa[limite.cliente][limite.tipo] = limite;
    });
    return mapa;
  }, [limites]);

  const abrirNuevo = () => {
    setEditingCliente(null);
    setFormData(LIMITE_FORM_INICIAL);
    setShowModal(true);
  };

  const abrirEditar = (cliente) => {
    const limitesCliente = limitesPorCliente[cliente.id] || {};
    setEditingCliente(cliente);
    setFormData({
      cliente_id: cliente.id,
      limite_diario: limitesCliente.DIARIO?.valor || '',
      limite_mensual: limitesCliente.MENSUAL?.valor || '',
    });
    setShowModal(true);
  };

  const guardarLimite = async (clienteId, tipo, valor, limiteActual) => {
    const valorNumero = Number(valor || 0);
    if (valorNumero <= 0) {
      return;
    }
    const payload = {
      cliente: clienteId,
      tipo,
      unidad: 'MONTO',
      valor: valorNumero,
      is_active: true,
      fecha_inicio: null,
      fecha_fin: null,
    };
    if (limiteActual?.id) {
      await limitesConsumoService.update(limiteActual.id, payload);
    } else {
      await limitesConsumoService.create(payload);
    }
  };

  const handleGuardarLimites = async (e) => {
    e.preventDefault();
    if (!formData.cliente_id) {
      alert('Selecciona un cliente.');
      return;
    }

    try {
      const clienteId = Number(formData.cliente_id);

      const limitesCliente = limitesPorCliente[clienteId] || {};
      await guardarLimite(clienteId, 'DIARIO', formData.limite_diario, limitesCliente.DIARIO);
      await guardarLimite(clienteId, 'MENSUAL', formData.limite_mensual, limitesCliente.MENSUAL);

      setShowModal(false);
      setFormData(LIMITE_FORM_INICIAL);
      await cargarDatos();
    } catch (error) {
      alert(`Error al guardar límites: ${JSON.stringify(error.response?.data || error.message)}`);
    }
  };

  const desactivarCliente = async (id) => {
    if (!confirm('¿Desactivar este cliente?')) return;
    try {
      await clientesService.delete(id);
      await cargarDatos();
    } catch (error) {
      alert(`Error al desactivar cliente: ${error.response?.data?.detail || error.message}`);
    }
  };

  const formatearValor = (valor, unidad) => {
    if (valor === null || valor === undefined) return 'Sin límite';
    if (unidad === 'LITROS') return `${Number(valor || 0).toFixed(2)} Lt`;
    return formatearBs(valor);
  };

  const claseEstado = (estado) => {
    if (estado === 'EXCEDIDO') return 'bg-red-100 text-red-700';
    if (estado === 'SIN_LIMITE') return 'bg-gray-100 text-gray-700';
    return 'bg-emerald-100 text-emerald-700';
  };

  const verConsumo = async (cliente) => {
    setConsumoModal({
      open: true,
      loading: true,
      clienteNombre: cliente.nombre,
      resumen: null,
      error: '',
    });
    try {
      const response = await limitesConsumoService.resumenConsumo(cliente.id);
      setConsumoModal({
        open: true,
        loading: false,
        clienteNombre: response.data?.cliente_nombre || cliente.nombre,
        resumen: response.data?.resumen || {},
        error: '',
      });
    } catch (error) {
      setConsumoModal({
        open: true,
        loading: false,
        clienteNombre: cliente.nombre,
        resumen: null,
        error: error.response?.data?.detail || 'No se pudo obtener el resumen de consumo.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-bold text-slate-900">Gestión de Clientes y Límites</h2>
        <Button onClick={abrirNuevo} fullWidth={false} size="small">Asignar límite</Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-5 text-left text-2xl font-bold text-slate-900">Cliente</th>
                <th className="px-6 py-5 text-left text-2xl font-bold text-slate-900">Límite diario</th>
                <th className="px-6 py-5 text-left text-2xl font-bold text-slate-900">Límite mensual</th>
                <th className="px-6 py-5 text-left text-2xl font-bold text-slate-900">Consumo</th>
                <th className="px-6 py-5 text-left text-2xl font-bold text-slate-900">Estado</th>
                <th className="px-6 py-5 text-left text-2xl font-bold text-slate-900">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clientes.map((cliente) => {
                const limitesCliente = limitesPorCliente[cliente.id] || {};
                return (
                  <tr key={cliente.id} className="hover:bg-gray-50">
                    <td className="px-6 py-5">
                      <p className="text-2xl font-semibold text-slate-900">{cliente.nombre}</p>
                      <p className="text-lg text-gray-500">{cliente.email}</p>
                    </td>
                    <td className="px-6 py-5 text-xl text-slate-900">
                      {formatearBs(limitesCliente.DIARIO?.valor || 0)}
                    </td>
                    <td className="px-6 py-5 text-xl text-slate-900">
                      {formatearBs(limitesCliente.MENSUAL?.valor || 0)}
                    </td>
                    <td className="px-6 py-5">
                      <button className="text-emerald-600 hover:text-emerald-700 text-lg font-medium" onClick={() => verConsumo(cliente)}>
                        Ver consumo
                      </button>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${cliente.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {cliente.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-5 space-x-4">
                      <button className="text-blue-600 hover:text-blue-800 text-lg" onClick={() => abrirEditar(cliente)}>Editar</button>
                      <button className="text-red-600 hover:text-red-800 text-lg" onClick={() => desactivarCliente(cliente.id)}>Desactivar</button>
                    </td>
                  </tr>
                );
              })}
              {!loading && clientes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-xl text-gray-500">
                    No hay clientes registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
            <h3 className="text-2xl font-bold mb-4">{editingCliente ? 'Editar límites de consumo' : 'Asignar límites de consumo'}</h3>
            <form className="space-y-4" onSubmit={handleGuardarLimites}>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Cliente</label>
                <select
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={formData.cliente_id}
                  onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
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
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Límite diario (Bs)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.limite_diario}
                  onChange={(e) => setFormData({ ...formData, limite_diario: e.target.value })}
                />
                <Input
                  label="Límite mensual (Bs)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.limite_mensual}
                  onChange={(e) => setFormData({ ...formData, limite_mensual: e.target.value })}
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <Button type="submit">Guardar</Button>
                <Button type="button" className="!bg-gray-200 !text-gray-700 hover:!bg-gray-300" onClick={() => setShowModal(false)}>Cancelar</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {consumoModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold">Consumo y saldo disponible</h3>
              <button
                className="text-gray-500 hover:text-gray-800"
                onClick={() => setConsumoModal((prev) => ({ ...prev, open: false }))}
              >
                Cerrar
              </button>
            </div>
            <p className="text-gray-600 mb-4">Cliente: <span className="font-semibold text-slate-900">{consumoModal.clienteNombre}</span></p>

            {consumoModal.loading && <p className="text-sm text-gray-500">Cargando resumen...</p>}
            {consumoModal.error && <p className="text-sm text-red-600">{consumoModal.error}</p>}

            {!consumoModal.loading && !consumoModal.error && (
              <div className="grid md:grid-cols-2 gap-4">
                {['DIARIO', 'MENSUAL'].map((tipo) => {
                  const data = consumoModal.resumen?.[tipo] || {};
                  return (
                    <div key={tipo} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold text-slate-900">{tipo === 'DIARIO' ? 'Diario' : 'Mensual'}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${claseEstado(data.estado)}`}>
                          {data.estado || 'SIN_LIMITE'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">Límite: <span className="font-semibold text-slate-900">{formatearValor(data.limite_configurado, data.unidad)}</span></p>
                      <p className="text-sm text-gray-600 mb-1">Consumido: <span className="font-semibold text-slate-900">{formatearValor(data.consumo_acumulado, data.unidad)}</span></p>
                      <p className="text-sm text-gray-600">Le queda: <span className="font-semibold text-slate-900">{formatearValor(data.saldo_restante, data.unidad)}</span></p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientesLimitesModule;
