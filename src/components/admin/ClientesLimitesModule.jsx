import { Fragment, useEffect, useMemo, useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { clientesService, limitesConsumoService, usuariosService } from '../../services/api';
import { reportesService } from '../../services/reportesService';

const LIMITE_FORM_INICIAL = {
  cliente_id: '',
  unidad: 'MONTO',
  limite_diario: '',
  limite_semanal: '',
  limite_mensual: '',
  fecha_inicio: '',
  fecha_fin: '',
};

function formatearBs(valor) {
  const numero = Number(valor || 0);
  return `Bs ${numero.toFixed(2)}`;
}

function formatearUnidad(valor, unidad) {
  const numero = Number(valor || 0);
  return unidad === 'LITROS' ? `${numero.toFixed(2)} L` : `Bs ${numero.toFixed(2)}`;
}

function ClientesLimitesModule() {
  const [clientes, setClientes] = useState([]);
  const [usuariosClientes, setUsuariosClientes] = useState([]);
  const [limites, setLimites] = useState([]);
  const [consumoData, setConsumoData] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [formData, setFormData] = useState(LIMITE_FORM_INICIAL);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [clientesRes, usuariosRes, limitesRes, reporteRes] = await Promise.all([
        clientesService.getAll(),
        usuariosService.getAll(),
        limitesConsumoService.getAll(),
        reportesService.getClientes({}).catch(() => ({ data: { ranking_clientes: [] } })),
      ]);

      const clientesData = Array.isArray(clientesRes.data) ? clientesRes.data : clientesRes.data.results || [];
      const usuariosData = Array.isArray(usuariosRes.data) ? usuariosRes.data : usuariosRes.data.results || [];

      setClientes(clientesData);
      setUsuariosClientes(
        usuariosData.filter((u) =>
          (u.roles_detalle || []).some((r) => r.nombre?.toLowerCase() === 'cliente')
        )
      );
      setLimites(Array.isArray(limitesRes.data) ? limitesRes.data : limitesRes.data.results || []);

      // Mapa de consumo por cliente_id
      const ranking = reporteRes.data?.ranking_clientes || [];
      const mapa = {};
      ranking.forEach((r) => {
        mapa[r.cliente_id] = {
          total_consumido: Number(r.total_consumido || 0),
          total_litros: Number(r.total_litros || 0),
          cantidad_ventas: Number(r.cantidad_ventas || 0),
        };
      });
      setConsumoData(mapa);
    } catch (error) {
      alert(`Error al cargar datos: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const limitesPorUsuario = useMemo(() => {
    const mapa = {};
    limites.forEach((limite) => {
      if (!mapa[limite.cliente]) mapa[limite.cliente] = {};
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
    const uid = cliente.usuario_id;
    const lc = limitesPorUsuario[uid] || {};
    const unidad = lc.DIARIO?.unidad || lc.SEMANAL?.unidad || lc.MENSUAL?.unidad || 'MONTO';
    setEditingCliente(cliente);
    setFormData({
      cliente_id: uid ?? '',
      unidad,
      limite_diario: lc.DIARIO?.valor || '',
      limite_semanal: lc.SEMANAL?.valor || '',
      limite_mensual: lc.MENSUAL?.valor || '',
      fecha_inicio: lc.DIARIO?.fecha_inicio || lc.SEMANAL?.fecha_inicio || lc.MENSUAL?.fecha_inicio || '',
      fecha_fin: lc.DIARIO?.fecha_fin || lc.SEMANAL?.fecha_fin || lc.MENSUAL?.fecha_fin || '',
    });
    setShowModal(true);
  };

  const guardarLimite = async (clienteId, tipo, valor, limiteActual, unidad, fechaInicio, fechaFin) => {
    const valorNumero = Number(valor || 0);
    if (valorNumero <= 0) return;
    const payload = {
      cliente: clienteId,
      tipo,
      unidad,
      valor: valorNumero,
      is_active: true,
      fecha_inicio: fechaInicio || null,
      fecha_fin: fechaFin || null,
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
      const cid = Number(formData.cliente_id);
      const lc = limitesPorUsuario[cid] || {};
      const u = formData.unidad;
      const fi = formData.fecha_inicio;
      const ff = formData.fecha_fin;

      await guardarLimite(cid, 'DIARIO', formData.limite_diario, lc.DIARIO, u, fi, ff);
      await guardarLimite(cid, 'SEMANAL', formData.limite_semanal, lc.SEMANAL, u, fi, ff);
      await guardarLimite(cid, 'MENSUAL', formData.limite_mensual, lc.MENSUAL, u, fi, ff);

      setShowModal(false);
      setFormData(LIMITE_FORM_INICIAL);
      await cargarDatos();
    } catch (error) {
      alert(`Error al guardar: ${JSON.stringify(error.response?.data || error.message)}`);
    }
  };

  const desactivarCliente = async (id) => {
    if (!confirm('¿Desactivar este cliente?')) return;
    try {
      await clientesService.delete(id);
      await cargarDatos();
    } catch (error) {
      alert(`Error: ${error.response?.data?.detail || error.message}`);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const BarraProgreso = ({ valor, maximo, color = 'bg-emerald-500' }) => {
    const pct = maximo > 0 ? Math.min(100, (valor / maximo) * 100) : 0;
    return (
      <div className="w-full h-2 bg-gray-200 rounded">
        <div className={`h-2 rounded ${color}`} style={{ width: `${pct}%` }} />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Gestión de Clientes y Límites</h2>
        <Button onClick={abrirNuevo} fullWidth={false} size="small">Asignar límite</Button>
      </div>

      {/* Tabla principal */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-8"></th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Cliente</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Crédito</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Límite diario</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Límite semanal</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Límite mensual</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Consumo total</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clientes.map((cliente) => {
                const lc = limitesPorUsuario[cliente.usuario_id] || {};
                const sinUsuario = !cliente.usuario_id;
                const consumo = consumoData[cliente.id] || {};
                const credUsado = Number(cliente.limite_credito || 0) - Number(cliente.saldo_credito || 0);
                const isExpanded = expandedId === cliente.id;

                return (
                  <Fragment key={cliente.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleExpand(cliente.id)}
                        className="text-gray-400 hover:text-gray-700 text-sm"
                      >
                        {isExpanded ? '▾' : '▸'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{cliente.nombre}</p>
                      <p className="text-xs text-gray-500">{cliente.email || cliente.nit || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      {Number(cliente.limite_credito || 0) > 0 ? (
                        <div className="min-w-[120px]">
                          <p className="text-xs text-gray-500 mb-1">
                            {formatearBs(cliente.saldo_credito)} / {formatearBs(cliente.limite_credito)}
                          </p>
                          <BarraProgreso
                            valor={credUsado}
                            maximo={Number(cliente.limite_credito)}
                            color={credUsado / Number(cliente.limite_credito) > 0.8 ? 'bg-red-500' : 'bg-emerald-500'}
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Sin crédito</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {lc.DIARIO ? formatearUnidad(lc.DIARIO.valor, lc.DIARIO.unidad) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {lc.SEMANAL ? formatearUnidad(lc.SEMANAL.valor, lc.SEMANAL.unidad) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {lc.MENSUAL ? formatearUnidad(lc.MENSUAL.valor, lc.MENSUAL.unidad) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-900">{formatearBs(consumo.total_consumido)}</p>
                      <p className="text-xs text-gray-400">{consumo.cantidad_ventas || 0} ventas</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${cliente.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {cliente.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      <button
                        className={`text-sm ${sinUsuario ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
                        onClick={() => !sinUsuario && abrirEditar(cliente)}
                        title={sinUsuario ? 'Sin cuenta de usuario vinculada' : 'Editar límites'}
                      >Editar</button>
                      <button className="text-sm text-red-600 hover:text-red-800" onClick={() => desactivarCliente(cliente.id)}>
                        Desactivar
                      </button>
                    </td>
                  </tr>

                  {/* Fila expandida */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={9} className="px-6 py-4 bg-gray-50">
                        <div className="grid md:grid-cols-3 gap-4">
                          {/* Info del cliente */}
                          <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <h4 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-3">Información</h4>
                            <div className="space-y-2 text-sm">
                              <p><span className="text-gray-500">NIT:</span> <span className="font-medium">{cliente.nit || '—'}</span></p>
                              <p><span className="text-gray-500">Teléfono:</span> <span className="font-medium">{cliente.telefono || '—'}</span></p>
                              <p><span className="text-gray-500">Email:</span> <span className="font-medium">{cliente.email || '—'}</span></p>
                              <p><span className="text-gray-500">Crédito disponible:</span> <span className="font-medium">{formatearBs(cliente.saldo_credito)}</span></p>
                            </div>
                          </div>

                          {/* Consumo real vs límites */}
                          <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <h4 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-3">Consumo vs Límites</h4>
                            {['DIARIO', 'SEMANAL', 'MENSUAL'].map((tipo) => {
                              const limite = lc[tipo];
                              if (!limite) return (
                                <div key={tipo} className="mb-2">
                                  <p className="text-xs text-gray-400">{tipo}: sin límite configurado</p>
                                </div>
                              );
                              return (
                                <div key={tipo} className="mb-3">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-600">{tipo}</span>
                                    <span className="font-medium">{formatearUnidad(limite.valor, limite.unidad)}</span>
                                  </div>
                                  <BarraProgreso valor={consumo.total_consumido || 0} maximo={Number(limite.valor)} />
                                  {limite.fecha_inicio && (
                                    <p className="text-[10px] text-gray-400 mt-1">
                                      Vigencia: {limite.fecha_inicio} → {limite.fecha_fin || '∞'}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Resumen de actividad */}
                          <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <h4 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-3">Actividad</h4>
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs text-gray-500">Total consumido</p>
                                <p className="text-lg font-bold text-slate-900">{formatearBs(consumo.total_consumido)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Litros totales</p>
                                <p className="text-lg font-bold text-slate-900">{(consumo.total_litros || 0).toFixed(2)} L</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Cantidad de ventas</p>
                                <p className="text-lg font-bold text-slate-900">{consumo.cantidad_ventas || 0}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                );
              })}
              {!loading && clientes.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-sm text-gray-500">
                    No hay clientes registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Asignar/Editar límites */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingCliente ? `Editar límites — ${editingCliente.nombre}` : 'Asignar límites de consumo'}
            </h3>
            <form className="space-y-4" onSubmit={handleGuardarLimites}>
              {/* Cliente */}
              {!editingCliente && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Cliente</label>
                  <select
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={formData.cliente_id}
                    onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                    required
                  >
                    <option value="">Selecciona un cliente</option>
                    {usuariosClientes.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Unidad */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Unidad</label>
                <select
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={formData.unidad}
                  onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                >
                  <option value="MONTO">Monto (Bs)</option>
                  <option value="LITROS">Litros</option>
                </select>
              </div>

              {/* Límites: Diario / Semanal / Mensual */}
              <div className="grid md:grid-cols-3 gap-4">
                <Input
                  label={`Límite diario (${formData.unidad === 'LITROS' ? 'L' : 'Bs'})`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.limite_diario}
                  onChange={(e) => setFormData({ ...formData, limite_diario: e.target.value })}
                />
                <Input
                  label={`Límite semanal (${formData.unidad === 'LITROS' ? 'L' : 'Bs'})`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.limite_semanal}
                  onChange={(e) => setFormData({ ...formData, limite_semanal: e.target.value })}
                />
                <Input
                  label={`Límite mensual (${formData.unidad === 'LITROS' ? 'L' : 'Bs'})`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.limite_mensual}
                  onChange={(e) => setFormData({ ...formData, limite_mensual: e.target.value })}
                />
              </div>

              {/* Vigencia */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Fecha inicio (opcional)</label>
                  <input
                    type="date"
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Fecha fin (opcional)</label>
                  <input
                    type="date"
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={formData.fecha_fin}
                    onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <Button type="submit">Guardar</Button>
                <Button type="button" className="!bg-gray-200 !text-gray-700 hover:!bg-gray-300" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientesLimitesModule;
