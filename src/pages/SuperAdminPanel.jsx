import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Plus, Power, LogOut, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import apiClient from '../services/api';
import { authService } from '../services/api';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
// Fix icono leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});
// Componente MapaPicker - DEBE IR ANTES de SuperAdminPanel
function MapaPicker({ onSelect, latitud, longitud }) {
    function Clicker() {
        useMapEvents({
            click(e) {
                onSelect(e.latlng.lat, e.latlng.lng);
            }
        });
        return null;
    }
    const centro = latitud && longitud ? [latitud, longitud] : [-17.7833, -63.1821];
    return (
        <MapContainer center={centro} zoom={13} style={{ height: '200px', width: '100%', borderRadius: '8px' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Clicker />
            {latitud && longitud && <Marker position={[latitud, longitud]} />}
        </MapContainer>
    );
}

function SuperAdminPanel() {
    const navigate = useNavigate();
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [exito, setExito] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingEmpresa, setEditingEmpresa] = useState(null);
    const [editFormData, setEditFormData] = useState({
        nombre: '', nit: '', telefono: '', email: '', direccion: '', plan: 'BASICO', num_islas: 1,
    });
    const [tiposCombustible] = useState([
        { tipo: 'GASOLINA_ESPECIAL', nombre: 'Gasolina Especial', precio_default: 6.96 },
        { tipo: 'GASOLINA_PREMIUM', nombre: 'Gasolina Premium', precio_default: 11.00 },
        { tipo: 'DIESEL', nombre: 'Diésel', precio_default: 9.80 },
        { tipo: 'GNV', nombre: 'GNV', precio_default: 2.73 },
    ]);
    const [tiposSeleccionados, setTiposSeleccionados] = useState({});
    const [formData, setFormData] = useState({
        nombre: '',
        nit: '',
        telefono: '',
        email: '',
        direccion: '',
        num_islas: 1,
        plan: 'BASICO',
        latitud: null,
        longitud: null,
        admin_nombre: '',
        admin_email: '',
        admin_password: '',
    });

    useEffect(() => {
        cargarEmpresas();
    }, []);

    const cargarEmpresas = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/empresas/');
            const data = Array.isArray(res.data) ? res.data : res.data.results || [];
            setEmpresas(data);
        } catch {
            setError('Error al cargar empresas');
        } finally {
            setLoading(false);
        }
    };

    const handleCrearEmpresa = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await apiClient.post('/empresas/', {
                ...formData,
                tipos_combustible: tiposSeleccionados
            });
            setExito('Empresa creada correctamente');
            setShowModal(false);
            setTiposSeleccionados({});
            setFormData({
                nombre: '', nit: '', telefono: '', email: '',
                direccion: '', plan: 'BASICO', latitud: null, longitud: null,
                admin_nombre: '', admin_email: '', admin_password: '',
            });
            await cargarEmpresas();
        } catch (err) {
            const errData = err.response?.data;
            const msg = errData?.admin_email?.[0] || errData?.nombre?.[0] || errData?.error || 'Error al crear empresa';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const cambiarEstado = async (empresa, nuevoEstado) => {
        try {
            await apiClient.patch(`/empresas/${empresa.id}/cambiar_estado/`, { estado: nuevoEstado });
            await cargarEmpresas();
        } catch {
            setError('Error al cambiar estado');
        }
    };

    const handleLogout = async () => {
        await authService.logout();
        navigate('/login');
    };

    const estadoColor = {
        ACTIVA: 'bg-emerald-100 text-emerald-700',
        INACTIVA: 'bg-gray-100 text-gray-600',
        SUSPENDIDA: 'bg-red-100 text-red-700',
    };

    const planColor = {
        BASICO: 'bg-blue-100 text-blue-700',
        PROFESIONAL: 'bg-purple-100 text-purple-700',
        ENTERPRISE: 'bg-amber-100 text-amber-700',
    };
    const handleEditarEmpresa = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const payload = {
                nombre: editFormData.nombre,
                nit: editFormData.nit,
                telefono: editFormData.telefono,
                email: editFormData.email,
                direccion: editFormData.direccion,
                plan: editFormData.plan,
            };
            if (editFormData.nuevo_admin_email) {
                payload.nuevo_admin_email = editFormData.nuevo_admin_email;
                payload.nuevo_admin_nombre = editFormData.nuevo_admin_nombre;
                payload.nuevo_admin_password = editFormData.nuevo_admin_password;
            }
            await apiClient.patch(`/empresas/${editingEmpresa.id}/`, payload);
            setExito('Empresa actualizada correctamente');
            setShowEditModal(false);
            setEditingEmpresa(null);
            await cargarEmpresas();
        } catch (err) {
            setError(err.response?.data?.error || 'Error al actualizar empresa');
        } finally {
            setLoading(false);
        }

    };
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-bold">
                        <span className="text-white">Surtidor</span>
                        <span className="ml-2 text-xs bg-emerald-500 px-2 py-0.5 rounded-full font-normal">Super Admin</span>
                    </h1>
                    <p className="text-xs text-gray-400 mt-0.5">Panel de gestión de empresas</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition"
                >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                </button>
            </div>

            <div className="max-w-6xl mx-auto p-6 space-y-6">

                {/* KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Total empresas</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{empresas.length}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Activas</p>
                        <p className="text-2xl font-bold text-emerald-600 mt-1">
                            {empresas.filter(e => e.estado === 'ACTIVA').length}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Suspendidas</p>
                        <p className="text-2xl font-bold text-red-500 mt-1">
                            {empresas.filter(e => e.estado === 'SUSPENDIDA').length}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Total usuarios</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">
                            {empresas.reduce((acc, e) => acc + (e.total_usuarios || 0), 0)}
                        </p>
                    </div>
                </div>

                {/* Header tabla */}
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">Empresas registradas</h2>
                    <Button onClick={() => setShowModal(true)} fullWidth={false} size="small">
                        <Plus className="w-4 h-4 mr-1" /> Nueva empresa
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

                {/* Tabla de empresas */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Empresa</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">NIT</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Plan</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Usuarios</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Sucursales</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Estado</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500"></div>
                                                Cargando...
                                            </div>
                                        </td>
                                    </tr>
                                ) : empresas.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                                            No hay empresas registradas
                                        </td>
                                    </tr>
                                ) : (
                                    empresas.map(empresa => (
                                        <tr key={empresa.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                                        <Building2 className="w-4 h-4 text-slate-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900">{empresa.nombre}</p>
                                                        <p className="text-xs text-gray-400">{empresa.email || '—'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{empresa.nit || '—'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${planColor[empresa.plan]}`}>
                                                    {empresa.plan}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{empresa.total_usuarios}</td>
                                            <td className="px-4 py-3 text-gray-600">{empresa.total_sucursales}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${estadoColor[empresa.estado]}`}>
                                                    {empresa.estado}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingEmpresa(empresa);
                                                            setEditFormData({
                                                                nombre: empresa.nombre || '',
                                                                nit: empresa.nit || '',
                                                                telefono: empresa.telefono || '',
                                                                email: empresa.email || '',
                                                                direccion: empresa.direccion || '',
                                                                plan: empresa.plan || 'BASICO',
                                                            });
                                                            setShowEditModal(true);
                                                        }}
                                                        className="text-xs text-blue-600 hover:text-blue-800"
                                                    >
                                                        Editar
                                                    </button>
                                                    {empresa.estado !== 'ACTIVA' && (
                                                        <button onClick={() => cambiarEstado(empresa, 'ACTIVA')} className="text-xs text-emerald-600 hover:text-emerald-800">
                                                            Activar
                                                        </button>
                                                    )}
                                                    {empresa.estado !== 'SUSPENDIDA' && (
                                                        <button onClick={() => cambiarEstado(empresa, 'SUSPENDIDA')} className="text-xs text-red-600 hover:text-red-800">
                                                            Suspender
                                                        </button>
                                                    )}
                                                    {empresa.estado !== 'INACTIVA' && (
                                                        <button onClick={() => cambiarEstado(empresa, 'INACTIVA')} className="text-xs text-gray-500 hover:text-gray-700">
                                                            Desactivar
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal nueva empresa */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg sm:text-xl font-bold mb-4">Nueva Empresa</h3>
                        <form onSubmit={handleCrearEmpresa} className="space-y-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Datos de la empresa</p>
                            <Input label="Nombre de la empresa" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} required />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Input label="NIT" value={formData.nit} onChange={e => setFormData({ ...formData, nit: e.target.value })} />
                                <Input label="Teléfono" value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value })} />
                            </div>
                            <Input label="Email empresa" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            <Input label="Dirección" value={formData.direccion} onChange={e => setFormData({ ...formData, direccion: e.target.value })} />
                            <Input
                                label="Número de islas"
                                type="number"
                                min="0"
                                max="20"
                                value={formData.num_islas}
                                onChange={e => setFormData({ ...formData, num_islas: parseInt(e.target.value) })}
                            />
                            {/* MAPA - agregar aquí */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                                    Ubicación en el mapa — haz clic para marcar
                                </label>
                                <MapaPicker
                                    latitud={formData.latitud}
                                    longitud={formData.longitud}
                                    onSelect={(lat, lng) => setFormData({ ...formData, latitud: lat, longitud: lng })}
                                />
                                {formData.latitud && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        Lat: {formData.latitud.toFixed(6)}, Lng: {formData.longitud.toFixed(6)}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Plan</label>
                                <select
                                    value={formData.plan}
                                    onChange={e => setFormData({ ...formData, plan: e.target.value })}
                                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="BASICO">Básico</option>
                                    <option value="PROFESIONAL">Profesional</option>
                                    <option value="ENTERPRISE">Enterprise</option>
                                </select>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                    Tipos de combustible y precios
                                </p>
                                <div className="space-y-2">
                                    {tiposCombustible.map(t => (
                                        <div key={t.tipo} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <input
                                                    type="checkbox"
                                                    id={`tipo-${t.tipo}`}
                                                    checked={!!tiposSeleccionados[t.tipo]}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setTiposSeleccionados({ ...tiposSeleccionados, [t.tipo]: t.precio_default });
                                                        } else {
                                                            const { [t.tipo]: _, ...rest } = tiposSeleccionados;
                                                            setTiposSeleccionados(rest);
                                                        }
                                                    }}
                                                    className="h-4 w-4 text-emerald-500 rounded flex-shrink-0"
                                                />
                                                <label htmlFor={`tipo-${t.tipo}`} className="text-sm text-gray-700">{t.nombre}</label>
                                            </div>
                                            {tiposSeleccionados[t.tipo] !== undefined && (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs text-gray-400">Bs.</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={tiposSeleccionados[t.tipo]}
                                                        onChange={(e) => setTiposSeleccionados({ ...tiposSeleccionados, [t.tipo]: parseFloat(e.target.value) })}
                                                        className="border border-gray-300 rounded px-2 py-1 text-sm w-full sm:w-24"
                                                    />
                                                    <span className="text-xs text-gray-400">/Lt</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">Administrador de la empresa</p>
                            <Input label="Nombre del administrador" value={formData.admin_nombre} onChange={e => setFormData({ ...formData, admin_nombre: e.target.value })} required />
                            <Input label="Email del administrador" type="email" value={formData.admin_email} onChange={e => setFormData({ ...formData, admin_email: e.target.value })} required />
                            <Input label="Contraseña inicial" type="password" value={formData.admin_password} onChange={e => setFormData({ ...formData, admin_password: e.target.value })} required />

                            {error && <p className="text-xs text-red-500">{error}</p>}

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <Button type="submit" loading={loading}>Crear empresa</Button>
                                <Button type="button" onClick={() => setShowModal(false)} className="!bg-gray-200 !text-gray-700 hover:!bg-gray-300">Cancelar</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showEditModal && editingEmpresa && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-4 sm:p-6">
                        <h3 className="text-lg sm:text-xl font-bold mb-4">Editar Empresa</h3>
                        <form onSubmit={handleEditarEmpresa} className="space-y-4">
                            <Input label="Nombre de la empresa" value={editFormData.nombre} onChange={e => setEditFormData({ ...editFormData, nombre: e.target.value })} required />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Input label="NIT" value={editFormData.nit} onChange={e => setEditFormData({ ...editFormData, nit: e.target.value })} />
                                <Input label="Teléfono" value={editFormData.telefono} onChange={e => setEditFormData({ ...editFormData, telefono: e.target.value })} />
                            </div>
                            <Input label="Email empresa" type="email" value={editFormData.email} onChange={e => setEditFormData({ ...editFormData, email: e.target.value })} />
                            <Input label="Dirección" value={editFormData.direccion} onChange={e => setEditFormData({ ...editFormData, direccion: e.target.value })} />
                            <Input
    label="Número de islas"
    type="number"
    min="1"
    max="20"
    value={editFormData.num_islas || 1}
    onChange={e => setEditFormData({ ...editFormData, num_islas: parseInt(e.target.value) })}
/>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Plan</label>
                                <select
                                    value={editFormData.plan}
                                    onChange={e => setEditFormData({ ...editFormData, plan: e.target.value })}
                                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="BASICO">Básico</option>
                                    <option value="PROFESIONAL">Profesional</option>
                                    <option value="ENTERPRISE">Enterprise</option>
                                </select>
                            </div>
                            <div className="border-t border-gray-200 pt-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                    Cambiar administrador (opcional)
                                </p>
                                <Input
                                    label="Email del nuevo administrador"
                                    type="email"
                                    value={editFormData.nuevo_admin_email || ''}
                                    onChange={e => setEditFormData({ ...editFormData, nuevo_admin_email: e.target.value })}
                                    placeholder="Dejar vacío para no cambiar"
                                />
                                {editFormData.nuevo_admin_email && (
                                    <>
                                        <Input
                                            label="Nombre del administrador"
                                            value={editFormData.nuevo_admin_nombre || ''}
                                            onChange={e => setEditFormData({ ...editFormData, nuevo_admin_nombre: e.target.value })}
                                            required
                                        />
                                        <Input
                                            label="Contraseña inicial"
                                            type="password"
                                            value={editFormData.nuevo_admin_password || ''}
                                            onChange={e => setEditFormData({ ...editFormData, nuevo_admin_password: e.target.value })}
                                            required
                                        />
                                    </>
                                )}
                            </div>
                            {error && <p className="text-xs text-red-500">{error}</p>}
                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <Button type="submit" loading={loading}>Guardar cambios</Button>
                                <Button type="button" onClick={() => setShowEditModal(false)} className="!bg-gray-200 !text-gray-700 hover:!bg-gray-300">Cancelar</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SuperAdminPanel;