import { useState, useEffect } from 'react';
import { Users, Plus, Edit, UserX, UserCheck, Clock, X, AlertCircle, CheckCircle } from 'lucide-react';
import { personalService } from '../services/personalService';
import apiClient from '../services/api';

export default function PersonalPage() {
    const [personal, setPersonal] = useState([]);
    const [roles, setRoles] = useState([]);
    const [islas, setIslas] = useState([]);
    const [userRole, setUserRole] = useState(''); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');
    const [tab, setTab] = useState('personal'); // 'personal' | 'turnos'
    const [showModal, setShowModal] = useState(false);
    const [editando, setEditando] = useState(null);
    const [showTurnoModal, setShowTurnoModal] = useState(false);
    const [turnos, setTurnos] = useState([]);
    const [fechaTurnos, setFechaTurnos] = useState(new Date().toISOString().split('T')[0]);
    const [verPassword, setVerPassword] = useState(false);

    const [formData, setFormData] = useState({
        nombre: '', email: '', password: '', rol_id: '', sucursal: ''
    });
    const [turnoData, setTurnoData] = useState({
        isla: '', horario: '', operador_id: ''
    });

    useEffect(() => {
    const userStr = localStorage.getItem('user');
    let rol = '';
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            rol = user.roles_detalle?.[0]?.nombre?.toLowerCase() || '';
            setUserRole(rol);
        } catch (e) {
            console.error('Error parsing user:', e);
        }
    }
    cargarDatos(rol);
}, []);

    useEffect(() => {
        if (tab === 'turnos') cargarTurnos();
    }, [tab, fechaTurnos]);

    const cargarDatos = async (rolActual) => {
    setLoading(true);
    try {
        const [personalRes, rolesRes, islasRes] = await Promise.all([
            personalService.getAll(),
            personalService.getRoles(),
            personalService.getIslas(),
        ]);
        const personalData = Array.isArray(personalRes.data)
            ? personalRes.data
            : personalRes.data.results || [];
       setPersonal(personalData.filter(u => u.is_active !== false));
        const rolesData = Array.isArray(rolesRes.data)
            ? rolesRes.data
            : rolesRes.data.results || [];
        setRoles(rolesData.filter(r => {
            const nombreRol = r.nombre?.toLowerCase();
            if (rolActual === 'administrador') {
                return ['gerente', 'operador', 'auditor'].includes(nombreRol);
            }
            if (rolActual === 'gerente') {
                return ['operador', 'auditor'].includes(nombreRol);
            }
            return false;
        }));
            const islasData = Array.isArray(islasRes.data)
                ? islasRes.data
                : islasRes.data.results || [];
            setIslas(islasData);
        } catch {
            setError('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    const cargarTurnos = async () => {
        try {
            const res = await personalService.getTurnos(fechaTurnos);
            setTurnos(Array.isArray(res.data) ? res.data : []);
        } catch {
            setTurnos([]);
        }
    };

    const mostrarExito = (msg) => {
        setExito(msg);
        setTimeout(() => setExito(''), 3000);
    };

    const abrirModal = (empleado = null) => {
        setEditando(empleado);
        setFormData({
            nombre: empleado?.nombre || '',
            email: empleado?.email || '',
            password: '',
            rol_id: empleado?.roles_detalle?.[0]?.id || '',
            sucursal: empleado?.sucursal || '',
        });
        setError('');
        setShowModal(true);
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const payload = {
                nombre: formData.nombre,
                email: formData.email,
            };
            if (formData.password) payload.password = formData.password;

            if (editando) {
                await personalService.editar(editando.id, payload);
                if (formData.rol_id) {
                    await personalService.asignarRoles(editando.id, [formData.rol_id]);
                }
                mostrarExito('Empleado actualizado correctamente');
            } else {
                if (!formData.password) {
                    setError('La contraseña es obligatoria para nuevos empleados');
                    return;
                }
                const res = await personalService.crear(payload);
                if (formData.rol_id) {
                    await personalService.asignarRoles(res.data.id, [formData.rol_id]);
                }
                mostrarExito('Empleado creado correctamente');
            }
            setShowModal(false);
            await cargarDatos();
        } catch (err) {
            setError(err.response?.data?.email?.[0] || err.response?.data?.error || 'Error al guardar');
        } finally {
            setLoading(false);
        }
    };

    const handleDesactivar = async (empleado) => {
        if (!confirm(`¿Desactivar a ${empleado.nombre}?`)) return;
        try {
            await personalService.desactivar(empleado.id);
            mostrarExito('Empleado desactivado correctamente');
            await cargarDatos();
        } catch (err) {
            setError(err.response?.data?.error || 'Error al desactivar');
        }
    };

    const handleAsignarTurno = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
        await apiClient.post('/turnos/', {
            isla: parseInt(turnoData.isla),
            horario: turnoData.horario,
            operador_id: parseInt(turnoData.operador_id),
            monto_inicial: 0,
        });
        mostrarExito('Turno asignado correctamente. Se notificará al operador.');
        setShowTurnoModal(false);
        await cargarTurnos();
    } catch (err) {
        setError(err.response?.data?.error || err.response?.data?.[0] || 'Error al asignar turno');
    } finally {
        setLoading(false);
    }
};

    const operadores = personal.filter(u =>
        u.roles_detalle?.some(r => r.nombre?.toLowerCase() === 'operador')
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-slate-900">Gestión de Personal</h2>
                </div>
                <div className="flex gap-2">
                    {tab === 'personal' && (
                        <button
                            onClick={() => abrirModal()}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
                        >
                            <Plus className="w-4 h-4" /> Nuevo Empleado
                        </button>
                    )}
                    {tab === 'turnos' && (
                        <button
                            onClick={() => { setError(''); setTurnoData({ isla: '', horario: '', operador_id: '' }); setShowTurnoModal(true); }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                        >
                            <Clock className="w-4 h-4" /> Asignar Turno
                        </button>
                    )}
                </div>
            </div>

            {/* TABS */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setTab('personal')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition ${tab === 'personal' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Users className="w-4 h-4 inline mr-2" />
                    Registro de Personal
                </button>
                <button
                    onClick={() => setTab('turnos')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition ${tab === 'turnos' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Clock className="w-4 h-4 inline mr-2" />
                    Asignación de Turnos
                </button>
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

            {/* TAB PERSONAL */}
            {tab === 'personal' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Nombre</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Rol</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Estado</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {personal.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No hay personal registrado</td></tr>
                            ) : personal.map(emp => (
                                <tr key={emp.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-slate-900">{emp.nombre}</td>
                                    <td className="px-4 py-3 text-gray-600">{emp.email}</td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                                            {emp.roles_detalle?.[0]?.nombre || 'Sin rol'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 text-xs rounded-full ${emp.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                            {emp.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 flex gap-2">
                                        <button onClick={() => abrirModal(emp)} className="text-blue-600 hover:text-blue-800">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        {emp.is_active && (
                                            <button onClick={() => handleDesactivar(emp)} className="text-red-500 hover:text-red-700">
                                                <UserX className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* TAB TURNOS */}
            {tab === 'turnos' && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-semibold text-gray-700">Fecha:</label>
                        <input
                            type="date"
                            value={fechaTurnos}
                            onChange={e => setFechaTurnos(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Operador</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Isla</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Horario</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Apertura</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Estado</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Ventas</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {turnos.length === 0 ? (
                                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No hay turnos para esta fecha</td></tr>
                                ) : turnos.map(t => (
                                    <tr key={t.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium">{t.operador}</td>
                                        <td className="px-4 py-3">Isla {t.isla}</td>
                                        <td className="px-4 py-3">{t.horario}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{new Date(t.fecha_apertura).toLocaleString('es-BO')}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs rounded-full ${t.estado === 'ABIERTO' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {t.estado}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">{t.cantidad_ventas}</td>
                                        <td className="px-4 py-3 font-semibold text-emerald-600">Bs. {t.total_ventas?.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Alerta islas sin cobertura */}
                    {islas.filter(isla => !turnos.some(t => t.isla === isla.numero && t.estado === 'ABIERTO')).length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <p className="text-amber-700 text-sm font-semibold">⚠️ Islas sin operador activo:</p>
                            <p className="text-amber-600 text-sm mt-1">
                                {islas.filter(isla => !turnos.some(t => t.isla === isla.numero && t.estado === 'ABIERTO'))
                                    .map(i => `Isla ${i.numero}`).join(', ')}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* MODAL EMPLEADO */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">{editando ? 'Editar Empleado' : 'Nuevo Empleado'}</h3>
                            <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleGuardar} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Nombre completo</label>
                                <input
                                    value={formData.nombre}
                                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    placeholder="Ej: Juan Pérez"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    placeholder="Ej: juan@estacion.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                                    {editando ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                                </label>
                                <div className="relative">
                                    <input
                                        type={verPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm pr-10"
                                        placeholder="Mínimo 8 caracteres"
                                        required={!editando}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setVerPassword(!verPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {verPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Rol</label>
                                <select
                                    value={formData.rol_id}
                                    onChange={e => setFormData({ ...formData, rol_id: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    required
                                >
                                    <option value="">Selecciona un rol</option>
                                    {roles.map(r => (
                                        <option key={r.id} value={r.id}>{r.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            {error && <p className="text-xs text-red-500">{error}</p>}
                            <div className="flex gap-3 pt-2">
                                <button type="submit" disabled={loading} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50">
                                    {loading ? 'Guardando...' : 'Guardar'}
                                </button>
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL TURNO */}
            {showTurnoModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Asignar Turno</h3>
                            <button onClick={() => setShowTurnoModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleAsignarTurno} className="space-y-4">
                               <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Operador</label>
                                <select
                                    value={turnoData.operador_id}
                                    onChange={e => setTurnoData({ ...turnoData, operador_id: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    required
                                >
                                    <option value="">Selecciona un operador</option>
                                    {operadores.map(op => (
                                        <option key={op.id} value={op.id}>{op.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Isla</label>
                                <select
                                    value={turnoData.isla}
                                    onChange={e => setTurnoData({ ...turnoData, isla: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    required
                                >
                                    <option value="">Selecciona una isla</option>
                                    {islas.map(i => (
                                        <option key={i.id} value={i.id}>Isla {i.numero}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Horario</label>
                                <select
                                    value={turnoData.horario}
                                    onChange={e => setTurnoData({ ...turnoData, horario: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    required
                                >
                                    <option value="">Selecciona un horario</option>
                                    <option value="MANANA">Mañana 06:00 - 14:00</option>
                                    <option value="TARDE">Tarde 14:00 - 22:00</option>
                                    <option value="NOCHE">Noche 22:00 - 06:00</option>
                                </select>
                            </div>
                            {error && <p className="text-xs text-red-500">{error}</p>}
                            <div className="flex gap-3 pt-2">
                                <button type="submit" disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                                    {loading ? 'Asignando...' : 'Asignar Turno'}
                                </button>
                                <button type="button" onClick={() => setShowTurnoModal(false)} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}