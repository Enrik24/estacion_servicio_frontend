import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import BitacoraTable from '../components/BitacoraTable';
import { turnosService, ventasService } from '../services/ventasService';
import { usuariosService, rolesService, permisosService } from '../services/api';
import { sucursalesService } from '../services/sucursalesService';
import apiClient from '../services/api';
import './BitacoraPage.css';
import ClientesLimitesModule from '../components/admin/ClientesLimitesModule';
import PrediccionesIAModule from '../components/admin/PrediccionesIAModule';
import { RolesModule, PermisosModule, BitacoraModule, TurnosAdminModule } from './AdminPanel';
import ConsolidacionCaja from './ConsolidacionCaja';
import PersonalPage from './PersonalPage';
import AsistenteIAModule from '../components/admin/AsistenteIAModule';

function GerenteUsuariosModule() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [exito, setExito] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const userActual = JSON.parse(localStorage.getItem('user') || '{}');
    const sucursalId = userActual.sucursal_id;

    const [formData, setFormData] = useState({
        nombre: '', email: '', rol: '', is_active: true, password: '', confirmPassword: ''
    });

    useEffect(() => {
        loadUsers();
        loadRoles();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const response = await usuariosService.getAll();
            const usersData = Array.isArray(response.data) ? response.data : response.data.results || [];
            setUsers(usersData);
            setCurrentPage(1);
        } catch (err) {
            setError('Error al cargar usuarios');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const loadRoles = async () => {
        try {
            const response = await rolesService.getAll();
            const rolesData = Array.isArray(response.data) ? response.data : response.data.results || [];
            // Gerente no puede asignar rol Administrador ni Superadmin
            setRoles(rolesData.filter(r => !['Administrador'].includes(r.nombre)));
        } catch (err) {
            console.error('Error loading roles:', err);
        }
    };

    const filteredUsers = users.filter((user) =>
        user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password || formData.confirmPassword) {
            if (formData.password !== formData.confirmPassword) {
                alert('Las contraseñas no coinciden');
                return;
            }
        }
        if (!editingUser && !formData.password) {
            alert('La contraseña es obligatoria para nuevos usuarios');
            return;
        }
        try {
            let userId;
            if (editingUser) {
                const { rol, confirmPassword, ...userData } = formData;
                if (!userData.password) delete userData.password;
                // Siempre asigna la sucursal del gerente
                await usuariosService.update(editingUser.id, { ...userData, sucursal: sucursalId });
                userId = editingUser.id;
            } else {
                const { rol, confirmPassword, ...userData } = formData;
                // Asigna automáticamente la sucursal del gerente
                const response = await usuariosService.create({ ...userData, sucursal: sucursalId });
                userId = response.data.id;
            }
            if (formData.rol) {
                await usuariosService.asignarRoles(userId, [parseInt(formData.rol)]);
            }
            await loadUsers();
            setExito('Usuario guardado correctamente');
            setTimeout(() => setExito(''), 3000);
            setShowModal(false);
            setEditingUser(null);
            setFormData({ nombre: '', email: '', rol: '', is_active: true, password: '', confirmPassword: '' });
        } catch (err) {
            alert('Error al guardar usuario: ' + (err.response?.data?.detail || err.message));
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        let userRol = '';
        if (user.roles_detalle?.length > 0) userRol = user.roles_detalle[0].id;
        else if (user.roles?.length > 0) userRol = user.roles[0];
        setFormData({
            nombre: user.nombre || '',
            email: user.email || '',
            rol: userRol,
            is_active: user.is_active !== undefined ? user.is_active : true,
            password: '',
            confirmPassword: ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (confirm('¿Está seguro de eliminar este usuario?')) {
            try {
                await usuariosService.delete(id);
                await loadUsers();
            } catch (err) {
                alert('Error al eliminar usuario');
            }
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Gestión de Usuarios</h2>
                {exito && <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-700 text-sm">{exito}</div>}
                <div className="mt-4">
                    <Button onClick={() => { setEditingUser(null); setFormData({ nombre: '', email: '', rol: '', is_active: true, password: '', confirmPassword: '' }); setShowModal(true); }} fullWidth={false} size="small">
                        Nuevo Usuario
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                    <Input type="text" placeholder="Buscar usuarios..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-md" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rol</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {paginatedUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-900">{user.nombre}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                                            {user.roles_detalle?.length > 0 ? user.roles_detalle.map(r => r.nombre).join(', ') : 'Sin rol'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {user.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 space-x-2">
                                        <button onClick={() => handleEdit(user)} className="text-blue-600 hover:text-blue-800 text-sm">Editar</button>
                                        <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-800 text-sm">Eliminar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input label="Nombre Completo" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required />
                            <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                            {editingUser ? (
                                <>
                                    <Input label="Contraseña (opcional)" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                                    <Input label="Confirmar Contraseña" type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} />
                                </>
                            ) : (
                                <>
                                    <Input label="Contraseña" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                                    <Input label="Confirmar Contraseña" type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required />
                                </>
                            )}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Rol</label>
                                <select value={formData.rol} onChange={(e) => setFormData({ ...formData, rol: e.target.value })} className="block w-full border border-gray-300 rounded-lg px-3 py-2" required>
                                    <option value="">Selecciona un rol</option>
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.id}>{role.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Estado</label>
                                <select value={formData.is_active === true ? 'Activo' : 'Inactivo'} onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'Activo' })} className="block w-full border border-gray-300 rounded-lg px-3 py-2">
                                    <option value="Activo">Activo</option>
                                    <option value="Inactivo">Inactivo</option>
                                </select>
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <Button type="submit">Guardar</Button>
                                <Button type="button" onClick={() => setShowModal(false)} className="!bg-gray-200 !text-gray-700 hover:!bg-gray-300">Cancelar</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function GerentePanel() {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Header showNav={false} showUserMenu variant="light" fixed={false} adminMode />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
                    <Routes>
                        <Route path="/" element={<Navigate to="usuarios" replace />} />
                        <Route path="usuarios" element={<GerenteUsuariosModule />} />
                        <Route path="personal" element={<PersonalPage />} />
                        <Route path="roles" element={<RolesModule />} />
                        <Route path="permisos" element={<PermisosModule />} />
                        <Route path="bitacora" element={<BitacoraModule />} />
                        <Route path="turnos" element={<TurnosAdminModule />} />
                        <Route path="consolidacion" element={<ConsolidacionCaja />} />
                        <Route path="clientes-limites" element={<ClientesLimitesModule />} />
                        <Route path="predicciones-ia" element={<PrediccionesIAModule />} />
                        <Route path="asistente-ia" element={<AsistenteIAModule />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}

export default GerentePanel;