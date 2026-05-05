import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Fuel, Clock, ShoppingCart, AlertCircle, CheckCircle } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { turnosService, islasService, ladosService, tiposCombustibleService, clientesService, ventasService } from '../services/ventasService';

function TurnoModule() {
    const [turno, setTurno] = useState(null);
    const [islas, setIslas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showAbrirModal, setShowAbrirModal] = useState(false);
    const [showCerrarModal, setShowCerrarModal] = useState(false);
    const [abrirDatos, setAbrirDatos] = useState({ isla: '', horario: '' });
    const [cierreDatos, setCierreDatos] = useState({ monto_final: '', observaciones: '' });

    useEffect(() => {
        cargarTurno();
        cargarIslas();
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

    const cargarIslas = async () => {
        try {
            const response = await islasService.getAll();
            const data = Array.isArray(response.data) ? response.data : response.data.results || [];
            setIslas(data.filter(i => i.estado === 'ACTIVO'));
        } catch (err) {
            console.error('Error cargando islas:', err);
        }
    };

    const handleAbrirTurno = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await turnosService.abrir({
                isla: parseInt(abrirDatos.isla),
                horario: abrirDatos.horario,
                monto_inicial: 0
            });
            setShowAbrirModal(false);
            setAbrirDatos({ isla: '', horario: '' });
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
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Gestión de Turno</h2>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}

            {turno && turno.id ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
                        <span className="self-start sm:self-auto px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
                            ABIERTO
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 uppercase font-semibold">Operador</p>
                            <p className="text-slate-900 font-medium mt-1 text-sm">{turno.operador_nombre}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 uppercase font-semibold">Isla</p>
                            <p className="text-slate-900 font-medium mt-1 text-sm">Isla {turno.isla_numero}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 col-span-2 sm:col-span-1">
                            <p className="text-xs text-gray-500 uppercase font-semibold">Horario</p>
                            <p className="text-slate-900 font-medium mt-1 text-sm">{turno.horario_display}</p>
                        </div>
                    </div>

                    <Button
                        onClick={() => setShowCerrarModal(true)}
                        fullWidth={false}
                        size="small"
                        className="!bg-red-500 hover:!bg-red-600"
                    >
                        Cerrar Turno
                    </Button>
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
                        <p className="text-gray-500 text-sm mt-1">Selecciona tu isla y horario para comenzar</p>
                    </div>
                    <Button onClick={() => setShowAbrirModal(true)} fullWidth={false}>
                        Abrir Turno
                    </Button>
                </div>
            )}

            {showAbrirModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold mb-4">Abrir Turno</h3>
                        <form onSubmit={handleAbrirTurno} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Isla asignada</label>
                                <select
                                    value={abrirDatos.isla}
                                    onChange={(e) => setAbrirDatos({ ...abrirDatos, isla: e.target.value })}
                                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    required
                                >
                                    <option value="">Selecciona una isla</option>
                                    {islas.map(i => (
                                        <option key={i.id} value={i.id}>
                                            Isla {i.numero} {i.descripcion ? `- ${i.descripcion}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Horario de turno</label>
                                <select
                                    value={abrirDatos.horario}
                                    onChange={(e) => setAbrirDatos({ ...abrirDatos, horario: e.target.value })}
                                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    required
                                >
                                    <option value="">Selecciona un horario</option>
                                    <option value="MANANA">Mañana 06:00 - 14:00</option>
                                    <option value="TARDE">Tarde 14:00 - 22:00</option>
                                    <option value="NOCHE">Noche 22:00 - 06:00</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="submit" loading={loading}>Confirmar apertura</Button>
                                <Button type="button" onClick={() => setShowAbrirModal(false)} className="!bg-gray-200 !text-gray-700 hover:!bg-gray-300">Cancelar</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showCerrarModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
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
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Observaciones</label>
                                <textarea
                                    value={cierreDatos.observaciones}
                                    onChange={(e) => setCierreDatos({ ...cierreDatos, observaciones: e.target.value })}
                                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    rows={3}
                                    placeholder="Novedades del turno..."
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="submit" loading={loading} className="!bg-red-500 hover:!bg-red-600">Confirmar Cierre</Button>
                                <Button type="button" onClick={() => setShowCerrarModal(false)} className="!bg-gray-200 !text-gray-700 hover:!bg-gray-300">Cancelar</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function RegistrarVentaModule() {
    const [turno, setTurno] = useState(null);
    const [lados, setLados] = useState([]);
    const [tiposCombustible, setTiposCombustible] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [ventas, setVentas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [exito, setExito] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        lado_id: '',
        tipo_combustible_id: '',
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
    }, [formData.tipo_combustible_id, formData.litros]);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const [turnoRes, tiposRes, clientesRes, ventasRes] = await Promise.all([
                turnosService.getMiTurno(),
                tiposCombustibleService.getAll(),
                clientesService.getAll(),
                ventasService.getMiTurnoVentas()
            ]);
            const turnoData = turnoRes.data.turno || turnoRes.data;
            setTurno(turnoData);

            if (turnoData && turnoData.isla) {
                const ladosRes = await ladosService.getPorIsla(turnoData.isla);
                const ladosData = Array.isArray(ladosRes.data) ? ladosRes.data : ladosRes.data.results || [];
                setLados(ladosData);
            }

            const tiposData = Array.isArray(tiposRes.data) ? tiposRes.data : tiposRes.data.results || [];
            setTiposCombustible(tiposData);
            const clientesData = Array.isArray(clientesRes.data) ? clientesRes.data : clientesRes.data.results || [];
            setClientes(clientesData);
            const ventasData = Array.isArray(ventasRes.data) ? ventasRes.data : ventasRes.data.ventas || [];
            setVentas(ventasData);
        } catch (err) {
            console.error('Error cargando datos:', err);
        } finally {
            setLoading(false);
        }
    };

    const calcularTotal = () => {
        if (!formData.tipo_combustible_id || !formData.litros) {
            setTotalCalculado(0);
            return;
        }
        const tipo = tiposCombustible.find(t => t.id === parseInt(formData.tipo_combustible_id));
        if (tipo) {
            setTotalCalculado((parseFloat(formData.litros) * parseFloat(tipo.precio_litro)).toFixed(2));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setExito(null);
        try {
            const payload = {
                lado_id: parseInt(formData.lado_id),
                tipo_combustible_id: parseInt(formData.tipo_combustible_id),
                litros: parseFloat(formData.litros),
                metodo_pago: formData.metodo_pago,
            };
            if (formData.cliente_id) payload.cliente_id = parseInt(formData.cliente_id);
            await ventasService.registrar(payload);
            setExito('Venta registrada correctamente');
            setFormData({ lado_id: '', tipo_combustible_id: '', litros: '', metodo_pago: 'EFECTIVO', cliente_id: '' });
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Registrar Venta</h2>
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

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Ventas del turno</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{ventas.length}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Total recaudado</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">Bs. {totalTurno}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 col-span-2 sm:col-span-1">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Isla asignada</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">Isla {turno.isla_numero}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                    <h3 className="font-semibold text-slate-900">Ventas del turno actual</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Comprobante</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Lado</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Combustible</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Litros</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Total</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Pago</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Estado</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {ventas.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">
                                        No hay ventas registradas en este turno
                                    </td>
                                </tr>
                            ) : (
                                ventas.map((venta) => (
                                    <tr key={venta.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{venta.numero_comprobante}</td>
                                        <td className="px-4 py-3 text-gray-900">Lado {venta.lado_nombre}</td>
                                        <td className="px-4 py-3 text-gray-900">{venta.tipo_combustible_nombre}</td>
                                        <td className="px-4 py-3 text-gray-900">{venta.litros} Lt</td>
                                        <td className="px-4 py-3 font-semibold text-slate-900">Bs. {venta.total}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                                                {venta.metodo_pago}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${venta.estado === 'COMPLETADA' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                {venta.estado}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {venta.estado === 'COMPLETADA' && (
                                                <button onClick={() => handleAnular(venta.id)} className="text-red-600 hover:text-red-800 text-xs">
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

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold mb-4">Nueva Venta — Isla {turno.isla_numero}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Lado</label>
                                <select
                                    value={formData.lado_id}
                                    onChange={(e) => setFormData({ ...formData, lado_id: e.target.value })}
                                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    required
                                >
                                    <option value="">Selecciona el lado</option>
                                    {lados.map(l => (
                                        <option key={l.id} value={l.id}>
                                            Lado {l.lado}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Tipo de combustible</label>
                                <select
                                    value={formData.tipo_combustible_id}
                                    onChange={(e) => setFormData({ ...formData, tipo_combustible_id: e.target.value })}
                                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    required
                                >
                                    <option value="">Selecciona el combustible</option>
                                    {tiposCombustible.map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.tipo_display} - Bs. {t.precio_litro}/Lt
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
                                    <p className="text-sm text-emerald-700 font-semibold">Total a cobrar: Bs. {totalCalculado}</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Método de pago</label>
                                <select
                                    value={formData.metodo_pago}
                                    onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    required
                                >
                                    <option value="EFECTIVO">Efectivo</option>
                                    <option value="TARJETA">Tarjeta</option>
                                    <option value="QR">Pago QR</option>
                                    <option value="CREDITO_FLEET">Crédito Fleet</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Cliente (opcional)</label>
                                <select
                                    value={formData.cliente_id}
                                    onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="">Sin cliente</option>
                                    {clientes.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.nombre} {c.nit ? `- NIT: ${c.nit}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button type="submit" loading={loading}>Registrar Venta</Button>
                                <Button type="button" onClick={() => setShowModal(false)} className="!bg-gray-200 !text-gray-700 hover:!bg-gray-300">Cancelar</Button>
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