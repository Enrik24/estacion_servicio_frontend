import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Fuel, Clock, ShoppingCart, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { turnosService, surtidoresService, clientesService, ventasService } from '../services/ventasService';

// Módulo de Turno
function TurnoModule() {
    const [turno, setTurno] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showCerrarModal, setShowCerrarModal] = useState(false);
    const [cierreDatos, setCierreDatos] = useState({ monto_final: '', observaciones: '' });

    useEffect(() => {
        cargarTurno();
    }, []);

    const cargarTurno = async () => {
        setLoading(true);
        try {
            const response = await turnosService.getMiTurno();
            setTurno(response.data.turno || response.data);
        } catch (err) {
            console.error('Error cargando turno:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAbrirTurno = async () => {
        setLoading(true);
        setError(null);
        try {
            await turnosService.abrir({ monto_inicial: 0 });
            await cargarTurno();
        } catch (err) {
            setError(err.response?.data?.error || 'Error al abrir turno');
        } finally {
            setLoading(false);
        }
    };

    const handleCerrarTurno = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await turnosService.cerrar(turno.id, cierreDatos);
            setTurno(null);
            setShowCerrarModal(false);
            setCierreDatos({ monto_final: '', observaciones: '' });
        } catch (err) {
            setError(err.response?.data?.error || 'Error al cerrar turno');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Gestión de Turno</h2>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}

            {turno && turno.id ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <Clock className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Turno #{turno.id} Activo</h3>
                                <p className="text-sm text-gray-500">
                                    Apertura: {new Date(turno.fecha_apertura).toLocaleString('es-BO')}
                                </p>
                            </div>
                        </div>
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
                            ABIERTO
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-500 uppercase font-semibold">Operador</p>
                            <p className="text-slate-900 font-medium mt-1">{turno.operador_nombre}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-500 uppercase font-semibold">Monto inicial</p>
                            <p className="text-slate-900 font-medium mt-1">Bs. {turno.monto_inicial}</p>
                        </div>
                    </div>

                    <div className="pt-2">
                        <Button
                            onClick={() => setShowCerrarModal(true)}
                            fullWidth={false}
                            size="small"
                            className="!bg-red-500 hover:!bg-red-600"
                        >
                            Cerrar Turno
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="p-4 bg-gray-100 rounded-full">
                            <Clock className="w-10 h-10 text-gray-400" />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg">No tienes un turno abierto</h3>
                        <p className="text-gray-500 text-sm mt-1">Abre un turno para comenzar a registrar ventas</p>
                    </div>
                    <Button onClick={handleAbrirTurno} loading={loading} fullWidth={false}>
                        Abrir Turno
                    </Button>
                </div>
            )}

            {showCerrarModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Cerrar Turno</h3>
                        <form onSubmit={handleCerrarTurno} className="space-y-4">
                            <Input
                                label="Monto final en caja"
                                type="number"
                                step="0.01"
                                value={cierreDatos.monto_final}
                                onChange={(e) => setCierreDatos({ ...cierreDatos, monto_final: e.target.value })}
                                required
                            />
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                                    Observaciones
                                </label>
                                <textarea
                                    value={cierreDatos.observaciones}
                                    onChange={(e) => setCierreDatos({ ...cierreDatos, observaciones: e.target.value })}
                                    className="block w-full border border-gray-300 rounded-lg px-3 py-2"
                                    rows={3}
                                    placeholder="Novedades del turno..."
                                />
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <Button type="submit" loading={loading} className="!bg-red-500 hover:!bg-red-600">
                                    Confirmar Cierre
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => setShowCerrarModal(false)}
                                    className="!bg-gray-200 !text-gray-700 hover:!bg-gray-300"
                                >
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

// Módulo de Registro de Venta
function RegistrarVentaModule() {
    const [turno, setTurno] = useState(null);
    const [surtidores, setSurtidores] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [ventas, setVentas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [exito, setExito] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        surtidor_id: '',
        litros: '',
        metodo_pago: 'EFECTIVO',
        cliente_id: ''
    });
    const [totalCalculado, setTotalCalculado] = useState(0);

    useEffect(() => {
        cargarDatos();
    }, []);

    useEffect(() => {
        calcularTotal();
    }, [formData.surtidor_id, formData.litros]);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const [turnoRes, surtidoresRes, clientesRes, ventasRes] = await Promise.all([
                turnosService.getMiTurno(),
                surtidoresService.getAll(),
                clientesService.getAll(),
                ventasService.getMiTurnoVentas()
            ]);
            setTurno(turnoRes.data.turno || turnoRes.data);
            const surtidoresData = Array.isArray(surtidoresRes.data) ? surtidoresRes.data : surtidoresRes.data.results || [];
            setSurtidores(surtidoresData);
            const clientesData = Array.isArray(clientesRes.data) ? clientesRes.data : clientesRes.data.results || [];
            setClientes(clientesData);
            const ventasData = Array.isArray(ventasRes.data) ? ventasRes.data : ventasRes.data.ventas || [];
            setVentas(ventasData);
            if (surtidoresData.length > 0) {
                setFormData(prev => ({ ...prev, surtidor_id: surtidoresData[0].id }));
            }
        } catch (err) {
            console.error('Error cargando datos:', err);
        } finally {
            setLoading(false);
        }
    };

    const calcularTotal = () => {
        if (!formData.surtidor_id || !formData.litros) {
            setTotalCalculado(0);
            return;
        }
        const surtidor = surtidores.find(s => s.id === parseInt(formData.surtidor_id));
        if (surtidor) {
            setTotalCalculado((parseFloat(formData.litros) * parseFloat(surtidor.precio_litro)).toFixed(2));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setExito(null);
        try {
            const payload = {
                surtidor_id: parseInt(formData.surtidor_id),
                litros: parseFloat(formData.litros),
                metodo_pago: formData.metodo_pago,
            };
            if (formData.cliente_id) payload.cliente_id = parseInt(formData.cliente_id);
            await ventasService.registrar(payload);
            setExito('Venta registrada correctamente');
            setFormData({ surtidor_id: surtidores[0]?.id || '', litros: '', metodo_pago: 'EFECTIVO', cliente_id: '' });
            setTotalCalculado(0);
            setShowModal(false);
            await cargarDatos();
        } catch (err) {
            setError(err.response?.data?.error || 'Error al registrar la venta');
        } finally {
            setLoading(false);
        }
    };

    const handleAnular = async (id) => {
        if (!confirm('¿Está seguro de anular esta venta?')) return;
        try {
            await ventasService.anular(id);
            await cargarDatos();
        } catch (err) {
            setError('Error al anular la venta');
        }
    };

    const totalTurno = ventas.reduce((acc, v) => acc + parseFloat(v.total), 0).toFixed(2);

    if (!turno || !turno.id) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-orange-400 mx-auto" />
                <h3 className="font-bold text-slate-900 text-lg">Sin turno activo</h3>
                <p className="text-gray-500 text-sm">Debes abrir un turno antes de registrar ventas</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Registrar Venta</h2>
                <Button onClick={() => setShowModal(true)} fullWidth={false} size="small">
                    Nueva Venta
                </Button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}
            {exito && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <p className="text-emerald-700 text-sm">{exito}</p>
                </div>
            )}

            {/* Resumen del turno */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Ventas del turno</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{ventas.length}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Total recaudado</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">Bs. {totalTurno}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Turno</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">#{turno.id}</p>
                </div>
            </div>

            {/* Tabla de ventas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="font-semibold text-slate-900">Ventas del turno actual</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Comprobante</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Litros</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Precio/Lt</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Método pago</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {ventas.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">
                                        No hay ventas registradas en este turno
                                    </td>
                                </tr>
                            ) : (
                                ventas.map((venta) => (
                                    <tr key={venta.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-xs font-mono text-gray-600">{venta.numero_comprobante}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900">{venta.litros} Lt</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">Bs. {venta.precio_unitario}</td>
                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">Bs. {venta.total}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                                                {venta.metodo_pago}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                venta.estado === 'COMPLETADA'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {venta.estado}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {venta.estado === 'COMPLETADA' && (
                                                <button
                                                    onClick={() => handleAnular(venta.id)}
                                                    className="text-red-600 hover:text-red-800 text-sm"
                                                >
                                                    Anular
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal registrar venta */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Nueva Venta</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                                    Surtidor
                                </label>
                                <select
                                    value={formData.surtidor_id}
                                    onChange={(e) => setFormData({ ...formData, surtidor_id: e.target.value })}
                                    className="block w-full border border-gray-300 rounded-lg px-3 py-2"
                                    required
                                >
                                    <option value="">Selecciona un surtidor</option>
                                    {surtidores.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            Surtidor {s.numero} - {s.tipo_combustible} - Bs. {s.precio_litro}/Lt
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <Input
                                label="Litros"
                                type="number"
                                step="0.001"
                                value={formData.litros}
                                onChange={(e) => setFormData({ ...formData, litros: e.target.value })}
                                required
                                placeholder="Ej: 10.000"
                            />

                            {totalCalculado > 0 && (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                                    <p className="text-sm text-emerald-700 font-semibold">
                                        Total a cobrar: Bs. {totalCalculado}
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                                    Método de pago
                                </label>
                                <select
                                    value={formData.metodo_pago}
                                    onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                                    className="block w-full border border-gray-300 rounded-lg px-3 py-2"
                                    required
                                >
                                    <option value="EFECTIVO">Efectivo</option>
                                    <option value="TARJETA">Tarjeta</option>
                                    <option value="QR">Pago QR</option>
                                    <option value="CREDITO_FLEET">Crédito Fleet</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                                    Cliente (opcional)
                                </label>
                                <select
                                    value={formData.cliente_id}
                                    onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                                    className="block w-full border border-gray-300 rounded-lg px-3 py-2"
                                >
                                    <option value="">Sin cliente</option>
                                    {clientes.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.nombre} {c.nit ? `- NIT: ${c.nit}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <Button type="submit" loading={loading}>Registrar Venta</Button>
                                <Button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="!bg-gray-200 !text-gray-700 hover:!bg-gray-300"
                                >
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

function VentasPanel() {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Header showNav={false} showUserMenu variant="light" fixed={false} adminMode />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
                    <Routes>
                        <Route path="/" element={<Navigate to="turno" replace />} />
                        <Route path="turno" element={<TurnoModule />} />
                        <Route path="registrar" element={<RegistrarVentaModule />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}

export default VentasPanel;