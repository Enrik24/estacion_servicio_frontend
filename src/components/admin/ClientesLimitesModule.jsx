import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { clientesService, limitesConsumoService, usuariosService } from '../../services/api';
import { puntosService } from '../../services/puntosService';

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
  const [rankingPuntos, setRankingPuntos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [formData, setFormData] = useState(LIMITE_FORM_INICIAL);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [usuariosRes, limitesRes] = await Promise.all([
        usuariosService.getAll(),
        limitesConsumoService.getAll(),
      ]);
      const usuarios = Array.isArray(usuariosRes.data) ? usuariosRes.data : usuariosRes.data.results || [];
      const soloClientes = usuarios.filter((usuario) =>
        (usuario.roles_detalle || []).some((rol) => (rol.nombre || '').toLowerCase() === 'cliente')
      );
      setClientes(soloClientes);
      setLimites(Array.isArray(limitesRes.data) ? limitesRes.data : limitesRes.data.results || []);

      try {
        const rankRes = await puntosService.getRanking();
        setRankingPuntos(rankRes.data?.clientes || []);
      } catch {
        setRankingPuntos([]);
      }
    } catch (error) {
      alert(`Error al cargar clientes/límites: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Índice de puntos por nombre normalizado (los Usuario-cliente no comparten ID con ventas.Cliente)
  const puntosPorNombre = useMemo(() => {
    const norm = (s) => (s || '').toLowerCase().trim();
    const mapa = {};
    rankingPuntos.forEach((c) => {
      mapa[norm(c.nombre)] = c.puntos_acumulados;
    });
    return mapa;
  }, [rankingPuntos]);

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

  const verConsumo = (cliente) => {
    const limitesCliente = limitesPorCliente[cliente.id] || {};
    const diario = limitesCliente.DIARIO?.valor || 0;
    const mensual = limitesCliente.MENSUAL?.valor || 0;
    alert(`Consumo configurado para ${cliente.nombre}\nLímite diario: ${formatearBs(diario)}\nLímite mensual: ${formatearBs(mensual)}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-bold text-slate-900">Gestión de Clientes y Límites</h2>
        <div className="flex gap-2">
          <Link
            to="../puntos"
            className="inline-flex items-center gap-2 px-3 py-2 border border-amber-300 bg-amber-50 text-amber-800 rounded-lg text-sm font-semibold hover:bg-amber-100"
          >
            <Award className="w-4 h-4" />
            Programa de Puntos
          </Link>
          <Button onClick={abrirNuevo} fullWidth={false} size="small">Asignar límite</Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-5 text-left text-2xl font-bold text-slate-900">Cliente</th>
                <th className="px-6 py-5 text-left text-2xl font-bold text-slate-900">Límite diario</th>
                <th className="px-6 py-5 text-left text-2xl font-bold text-slate-900">Límite mensual</th>
                <th className="px-6 py-5 text-left text-2xl font-bold text-slate-900">Puntos</th>
                <th className="px-6 py-5 text-left text-2xl font-bold text-slate-900">Consumo</th>
                <th className="px-6 py-5 text-left text-2xl font-bold text-slate-900">Estado</th>
                <th className="px-6 py-5 text-left text-2xl font-bold text-slate-900">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clientes.map((cliente) => {
                const limitesCliente = limitesPorCliente[cliente.id] || {};
                const nombreKey = (cliente.nombre || '').toLowerCase().trim();
                const puntos = puntosPorNombre[nombreKey];
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
                      {puntos != null ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded-lg text-lg font-bold">
                          <Award className="w-4 h-4" />
                          {puntos.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-lg text-gray-400">—</span>
                      )}
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
                  <td colSpan={7} className="px-6 py-10 text-center text-xl text-gray-500">
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
    </div>
  );
}

export default ClientesLimitesModule;
