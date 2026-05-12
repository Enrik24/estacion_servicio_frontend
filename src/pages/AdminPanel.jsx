import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import MapaPicker from '../components/MapaPicker';
import BitacoraTable from '../components/BitacoraTable';
import { sucursalesService } from '../services/sucursalesService';
import { turnosService, ventasService } from '../services/ventasService';
import { usuariosService, rolesService, permisosService } from '../services/api';
import './BitacoraPage.css';
import ClientesLimitesModule from '../components/admin/ClientesLimitesModule';
import PrediccionesIAModule from '../components/admin/PrediccionesIAModule';

// Sub-modules
function UsuariosModule() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', email: '', rol: '', is_active: true, password: '', confirmPassword: '' });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load users and roles on mount
  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await usuariosService.getAll();
      // Handle both array and paginated response ({ results: [...] })
      const usersData = Array.isArray(response.data) ? response.data : response.data.results || [];
      setUsers(usersData);
      setCurrentPage(1); // Reset to first page when loading new data
    } catch (err) {
      setError('Error al cargar usuarios');
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await rolesService.getAll();
      const rolesData = Array.isArray(response.data) ? response.data : response.data.results || [];
      setRoles(rolesData);
    } catch (err) {
      console.error('Error loading roles:', err);
    }
  };

  // Pagination logic
  const filteredUsers = users.filter((user) =>
    user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate password match
    if (formData.password || formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        alert('Las contraseñas no coinciden');
        return;
      }
    }

    // For new user, password is required
    if (!editingUser && !formData.password) {
      alert('La contraseña es obligatoria para nuevos usuarios');
      return;
    }

    try {
      let userId;
      if (editingUser) {
        // Update basic user data (without role and confirmPassword)
        const { rol, confirmPassword, ...userData } = formData;
        // Only send password if it was entered
        if (!userData.password) {
          delete userData.password;
        }
        await usuariosService.update(editingUser.id, { ...userData, is_active: formData.is_active });
        userId = editingUser.id;
      } else {
        // Create new user (without confirmPassword)
        const { rol, confirmPassword, ...userData } = formData;
        const response = await usuariosService.create({ ...userData, is_active: formData.is_active });
        userId = response.data.id;
      }

      // Assign role using the specific endpoint
      if (formData.rol) {
        await usuariosService.asignarRoles(userId, [parseInt(formData.rol)]);
      }

      await loadUsers();
      setShowModal(false);
      setEditingUser(null);
      setFormData({ nombre: '', email: '', rol: '', is_active: true, password: '', confirmPassword: '' });
    } catch (err) {
      alert('Error al guardar usuario: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    // Handle role from roles_detalle or roles array
    let userRol = '';
    if (user.roles_detalle && user.roles_detalle.length > 0) {
      // Get first role ID from roles_detalle
      userRol = user.roles_detalle[0].id;
    } else if (user.roles && user.roles.length > 0) {
      // Fallback to roles array (IDs)
      userRol = user.roles[0];
    }
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
        <div className="mt-4">
          <Button onClick={() => { setEditingUser(null); setFormData({ nombre: '', email: '', rol: '', is_active: true, password: '', confirmPassword: '' }); setShowModal(true); }} fullWidth={false} size="small">Nuevo Usuario</Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <Input
            type="text"
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
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
                      {(() => {
                        // API returns roles_detalle with role objects
                        if (user.roles_detalle?.length > 0) {
                          return user.roles_detalle.map(r => r.nombre).join(', ');
                        }
                        // Fallback to roles array
                        if (user.roles?.length > 0) {
                          return user.roles.join(', ');
                        }
                        return 'Sin rol';
                      })()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
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
        {/* Pagination for Usuarios */}
        {filteredUsers.length > itemsPerPage && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredUsers.length)} de {filteredUsers.length} registros
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 text-sm rounded ${currentPage === page
                      ? 'bg-emerald-500 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nombre Completo"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              {editingUser && (
                <>
                  <Input
                    label="Contraseña (opcional - dejar en blanco para mantener actual)"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <Input
                    label="Confirmar Contraseña"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                </>
              )}
              {!editingUser && (
                <>
                  <Input
                    label="Contraseña"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <Input
                    label="Confirmar Contraseña"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                  />
                </>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Rol</label>
                <select
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                >
                  <option value="">Selecciona un rol</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Estado</label>
                <select
                  value={formData.is_active === true ? 'Activo' : 'Inactivo'}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'Activo' })}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2"
                >
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

function RolesModule() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '', permisos: [] });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const response = await rolesService.getAll();
      const rolesData = Array.isArray(response.data) ? response.data : response.data.results || [];
      setRoles(rolesData);
      setCurrentPage(1);
    } catch (err) {
      console.error('Error loading roles:', err);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      const response = await permisosService.getAll();
      const permsData = Array.isArray(response.data) ? response.data : response.data.results || [];
      setPermissions(permsData);
    } catch (err) {
      console.error('Error loading permissions:', err);
      setPermissions([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await rolesService.update(editingRole.id, formData);
      } else {
        await rolesService.create(formData);
      }
      await loadRoles();
      setShowModal(false);
      setEditingRole(null);
      setFormData({ nombre: '', descripcion: '', permisos: [] });
    } catch (err) {
      alert('Error al guardar rol: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Está seguro de eliminar este rol?')) {
      try {
        await rolesService.delete(id);
        await loadRoles();
      } catch (err) {
        alert('Error al eliminar rol');
      }
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(roles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRoles = roles.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const togglePermission = (permId) => {
    const newPerms = formData.permisos.includes(permId)
      ? formData.permisos.filter(p => p !== permId)
      : [...formData.permisos, permId];
    setFormData({ ...formData, permisos: newPerms });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Gestión de Roles</h2>
        <div className="mt-4">
          <Button onClick={() => setShowModal(true)} fullWidth={false} size="small">Nuevo Rol</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedRoles.map((role) => (
          <div key={role.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-slate-900">{role.nombre}</h3>
              <div className="space-x-2">
                <button
                  onClick={() => { setEditingRole(role); setFormData({ ...role, permisos: role.permisos || [] }); setShowModal(true); }}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(role.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Eliminar
                </button>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-4">{role.descripcion}</p>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">Permisos asignados:</p>
              <div className="flex flex-wrap gap-2">
                {role.permisos?.length > 0 ? role.permisos.map(permId => {
                  const perm = permissions.find(p => p.id === permId || p.codigo === permId);
                  return (
                    <span key={permId} className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700">
                      {perm?.nombre || permId}
                    </span>
                  );
                }) : (
                  <span className="text-xs text-gray-400">Sin permisos</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination for Roles */}
      {roles.length > itemsPerPage && (
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-gray-500">
            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, roles.length)} de {roles.length} registros
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 text-sm rounded ${currentPage === page
                    ? 'bg-emerald-500 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                  }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">{editingRole ? 'Editar Rol' : 'Nuevo Rol'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nombre del Rol"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Permisos</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {permissions.map(perm => (
                    <label key={perm.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permisos.includes(perm.id) || formData.permisos.includes(perm.codigo)}
                        onChange={() => togglePermission(perm.id || perm.codigo)}
                        className="rounded text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700">{perm.nombre}</span>
                    </label>
                  ))}
                  {permissions.length === 0 && (
                    <p className="text-sm text-gray-500">Cargando permisos...</p>
                  )}
                </div>
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

function PermisosModule() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPerm, setEditingPerm] = useState(null);
  const [formData, setFormData] = useState({ codigo: '', nombre: '', descripcion: '' });

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const response = await permisosService.getAll();
      const permsData = Array.isArray(response.data) ? response.data : response.data.results || [];
      setPermissions(permsData);
    } catch (err) {
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPerm) {
        await permisosService.update(editingPerm.id, formData);
      } else {
        await permisosService.create(formData);
      }
      await loadPermissions();
      setShowModal(false);
      setEditingPerm(null);
      setFormData({ codigo: '', nombre: '', descripcion: '' });
    } catch (err) {
      alert('Error al guardar permiso: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleEdit = (perm) => {
    setEditingPerm(perm);
    setFormData({ codigo: perm.codigo || '', nombre: perm.nombre, descripcion: perm.descripcion || '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Está seguro de eliminar este permiso?')) {
      try {
        await permisosService.delete(id);
        await loadPermissions();
      } catch (err) {
        alert('Error al eliminar permiso');
      }
    }
  };

  // Agrupar por módulo según el prefijo del código
  const getModulo = (codigo) => {
    const prefijo = codigo.split('.')[0];
    const modulos = {
      usuarios: 'Usuarios',
      roles: 'Roles',
      permisos: 'Permisos',
      bitacora: 'Bitácora',
      turnos: 'Turnos',
      ventas: 'Ventas',
      surtidores: 'Surtidores',
      clientes: 'Clientes',
    };
    return modulos[prefijo] || 'General';
  };

  const grouped = permissions.reduce((acc, perm) => {
    const modulo = getModulo(perm.codigo);
    if (!acc[modulo]) acc[modulo] = [];
    acc[modulo].push(perm);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Gestión de Permisos</h2>
        <Button onClick={() => { setEditingPerm(null); setFormData({ codigo: '', nombre: '', descripcion: '' }); setShowModal(true); }} fullWidth={false} size="small">
          Nuevo Permiso
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(grouped).map(([modulo, perms]) => (
          <div key={modulo} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-slate-700">{modulo}</h3>
              <p className="text-xs text-gray-400">{perms.length} permiso{perms.length !== 1 ? 's' : ''}</p>
            </div>
            <ul className="divide-y divide-gray-100">
              {perms.map((perm) => (
                <li key={perm.id} className="flex items-center justify-between px-4 py-2 hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{perm.nombre}</p>
                    <p className="text-xs text-gray-400 font-mono">{perm.codigo}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => handleEdit(perm)} className="text-xs text-blue-600 hover:text-blue-800">Editar</button>
                    <button onClick={() => handleDelete(perm.id)} className="text-xs text-red-500 hover:text-red-700">Eliminar</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">{editingPerm ? 'Editar Permiso' : 'Nuevo Permiso'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingPerm && (
                <Input
                  label="Código"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="ej: usuarios.ver"
                  required
                />
              )}
              <Input
                label="Nombre del Permiso"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={2}
                />
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

function BitacoraModule() {
  return <BitacoraTable itemsPerPage={5} isEmbedded={true} />;
}
function SucursalesModule() {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    nit: '',
    cantidad_islas: 1,
    tiene_gnv: false,
    estado: 'ACTIVA',
    latitud: '',
    longitud: ''
  });

  useEffect(() => {
    cargarSucursales();
  }, []);

  const cargarSucursales = async () => {
    setLoading(true);
    try {
      const response = await sucursalesService.getAll();
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setSucursales(data);
    } catch (err) {
      console.error('Error cargando sucursales:', err);
      setSucursales([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setExito('');
    try {
      if (editando) {
        await sucursalesService.actualizar(editando.id, formData);
        setExito('Sucursal actualizada correctamente');
      } else {
        await sucursalesService.crear(formData);
        setExito('Sucursal creada correctamente');
      }
      setShowModal(false);
      setEditando(null);
      resetForm();
      cargarSucursales();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar sucursal');
    }
  };

  const handleEditar = (sucursal) => {
    setEditando(sucursal);
    setFormData({
      nombre: sucursal.nombre || '',
      direccion: sucursal.direccion || '',
      telefono: sucursal.telefono || '',
      nit: sucursal.nit || '',
      cantidad_islas: sucursal.cantidad_islas || 1,
      tiene_gnv: sucursal.tiene_gnv || false,
      estado: sucursal.estado || 'ACTIVA',
      latitud: sucursal.latitud || '',
      longitud: sucursal.longitud || ''
    });
    setShowModal(true);
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Está seguro de eliminar esta sucursal?')) return;
    try {
      await sucursalesService.eliminar(id);
      setExito('Sucursal eliminada correctamente');
      cargarSucursales();
    } catch (err) {
      setError('Error al eliminar sucursal');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '', direccion: '', telefono: '', nit: '',
      cantidad_islas: 1, tiene_gnv: false, estado: 'ACTIVA',
      latitud: '', longitud: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl font-bold text-slate-900">Gestión de Sucursales</h2>
        <Button onClick={() => { resetForm(); setEditando(null); setShowModal(true); }} fullWidth={false} size="small">
          Nueva Sucursal
        </Button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2 text-sm">{error}</div>}
      {exito && <div className="bg-green-50 border border-green-200 text-green-600 rounded-lg px-4 py-2 text-sm">{exito}</div>}

      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm">Cargando sucursales...</div>
      ) : sucursales.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-400 text-sm">No hay sucursales registradas</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sucursales.map(s => (
            <div key={s.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">{s.nombre}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{s.direccion}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${s.estado === 'ACTIVA' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                  {s.estado}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-gray-400 uppercase font-semibold">Islas</p>
                  <p className="text-slate-800 font-medium mt-0.5">{s.cantidad_islas}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-gray-400 uppercase font-semibold">GNV</p>
                  <p className="text-slate-800 font-medium mt-0.5">{s.tiene_gnv ? 'Sí' : 'No'}</p>
                </div>
                {s.telefono && (
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-gray-400 uppercase font-semibold">Teléfono</p>
                    <p className="text-slate-800 font-medium mt-0.5">{s.telefono}</p>
                  </div>
                )}
                {s.nit && (
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-gray-400 uppercase font-semibold">NIT</p>
                    <p className="text-slate-800 font-medium mt-0.5">{s.nit}</p>
                  </div>
                )}
              </div>

              {s.cantidad_islas_creadas !== undefined && (
                <p className="text-xs text-gray-400">
                  {s.cantidad_islas_creadas} isla{s.cantidad_islas_creadas !== 1 ? 's' : ''} creada{s.cantidad_islas_creadas !== 1 ? 's' : ''}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button onClick={() => handleEditar(s)} className="text-xs text-blue-600 hover:text-blue-800">Editar</button>
                <button onClick={() => handleEliminar(s.id)} className="text-xs text-red-500 hover:text-red-700">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{editando ? 'Editar Sucursal' : 'Nueva Sucursal'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Nombre de la sucursal</label>
                  <input value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-slate-900 outline-none" placeholder="Ej: Surtidor Bolivia - Norte" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Dirección</label>
                  <input value={formData.direccion} onChange={e => setFormData({ ...formData, direccion: e.target.value })} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-slate-900 outline-none" placeholder="Ej: Av. Banzer Km 5, Santa Cruz" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Teléfono</label>
                  <input value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-slate-900 outline-none" placeholder="Ej: 3-4567890" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">NIT</label>
                  <input value={formData.nit} onChange={e => setFormData({ ...formData, nit: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-slate-900 outline-none" placeholder="Ej: 1234567890" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Cantidad de islas</label>
                  <input type="number" min="1" max="20" value={formData.cantidad_islas} onChange={e => setFormData({ ...formData, cantidad_islas: parseInt(e.target.value) })} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-slate-900 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Estado</label>
                  <select value={formData.estado} onChange={e => setFormData({ ...formData, estado: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-slate-900 outline-none">
                    <option value="ACTIVA">Activa</option>
                    <option value="INACTIVA">Inactiva</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <MapaPicker
                    latitud={formData.latitud}
                    longitud={formData.longitud}
                    onSelect={(lat, lng) => setFormData({ ...formData, latitud: lat, longitud: lng })}
                  />
                </div>
                <div className="sm:col-span-2 flex items-center gap-3">
                  <input type="checkbox" id="tiene_gnv" checked={formData.tiene_gnv} onChange={e => setFormData({ ...formData, tiene_gnv: e.target.checked })} className="h-4 w-4 text-emerald-500 rounded" />
                  <label htmlFor="tiene_gnv" className="text-sm text-gray-700">Esta sucursal tiene GNV</label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
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
function TurnosAdminModule() {
    const [turnos, setTurnos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [horario, setHorario] = useState('');
    const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
    const [ventas, setVentas] = useState([]);
    const [tabCombustible, setTabCombustible] = useState(null);
    const [loadingVentas, setLoadingVentas] = useState(false);

    useEffect(() => {
        cargarTurnos();
    }, [fecha, horario]);

    const cargarTurnos = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await turnosService.getResumen(fecha, horario);
            console.log('📤 Respuesta del backend:', response);
            console.log('📤 response.data:', response.data);
            
            let turnosData = [];
            
            // Intentar extraer los datos de diferentes formatos posibles
            if (Array.isArray(response.data)) {
                turnosData = response.data;
                console.log('✅ Datos es un array');
            } else if (response.data && typeof response.data === 'object') {
                // Si es un objeto, buscar la propiedad que contiene el array
                if (response.data.results && Array.isArray(response.data.results)) {
                    turnosData = response.data.results;
                    console.log('✅ Datos encontrados en response.data.results');
                } else if (response.data.turnos && Array.isArray(response.data.turnos)) {
                    turnosData = response.data.turnos;
                    console.log('✅ Datos encontrados en response.data.turnos');
                } else if (response.data.data && Array.isArray(response.data.data)) {
                    turnosData = response.data.data;
                    console.log('✅ Datos encontrados en response.data.data');
                } else {
                    console.warn('⚠️ No se encontró array en response.data:', Object.keys(response.data));
                    turnosData = [];
                }
            }
            
            console.log(`✅ Total de turnos cargados: ${turnosData.length}`, turnosData);
            setTurnos(turnosData);
        } catch (err) {
            console.error('❌ Error cargando turnos:', err);
            console.error('📥 Detalle del error:', err.response?.data);
            setError(err.response?.data?.detail || err.message || 'Error al cargar turnos');
            setTurnos([]);
        } finally {
            setLoading(false);
        }
    };

    const verVentas = async (turno) => {
        setTurnoSeleccionado(turno);
        setLoadingVentas(true);
        try {
            const response = await ventasService.getAll();
            const data = Array.isArray(response.data) ? response.data : response.data.results || [];
            setVentas(data.filter(v => v.turno === turno.id));
        } catch (err) {
            console.error('Error cargando ventas:', err);
            setVentas([]);
        } finally {
            setLoadingVentas(false);
        }
    };

    const totalGeneral = turnos.reduce((acc, t) => acc + (t.total_ventas || 0), 0).toFixed(2);
    const litrosGeneral = turnos.reduce((acc, t) => acc + (t.total_litros || 0), 0).toFixed(3);

    // Agregar litros por tipo de combustible de todos los turnos
    const litrosPorTipo = {};
    turnos.forEach(turno => {
        if (turno.litros_por_tipo && typeof turno.litros_por_tipo === 'object') {
            Object.entries(turno.litros_por_tipo).forEach(([tipo, datos]) => {
                if (!litrosPorTipo[tipo]) {
                    litrosPorTipo[tipo] = { cantidad: 0, unidad: datos.unidad || 'Lt' };
                }
                litrosPorTipo[tipo].cantidad += parseFloat(datos.cantidad || 0);
            });
        }
    });

    const tiposCombustible = Object.keys(litrosPorTipo);
    const tabActivo = tabCombustible && litrosPorTipo[tabCombustible] 
      ? tabCombustible 
      : tiposCombustible[0] || null;
    return (
        <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Resumen de Turnos</h2>

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Fecha</label>
                        <input
                            type="date"
                            value={fecha}
                            onChange={e => setFecha(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-slate-900 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Horario</label>
                        <select
                            value={horario}
                            onChange={e => setHorario(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-slate-900 outline-none"
                        >
                            <option value="">Todos los turnos</option>
                            <option value="MANANA">Mañana 06:00 - 14:00</option>
                            <option value="TARDE">Tarde 14:00 - 22:00</option>
                            <option value="NOCHE">Noche 22:00 - 06:00</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={cargarTurnos}
                            className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 text-sm hover:bg-slate-700 transition"
                        >
                            Actualizar
                        </button>
                    </div>
                </div>
            </div>

            {/* Mostrar error si existe */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                    ❌ {error}
                </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Turnos</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{turnos.length}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Ventas totales</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">Bs. {totalGeneral}</p>
                </div>
               <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
  <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
    Litros por combustible
  </p>

  {tiposCombustible.length === 0 ? (
    <p className="text-2xl font-bold text-slate-900 mt-1">0 Lt</p>
  ) : (
    <>
      <div className="flex flex-wrap gap-1 mb-3">
        {tiposCombustible.map((tipo) => (
          <button
            key={tipo}
            onClick={() => setTabCombustible(tipo)}
            className={`text-xs px-2 py-1 rounded-full border transition ${
              tabActivo === tipo
                ? 'bg-blue-100 text-blue-700 border-blue-300'
                : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
            }`}
          >
            {tipo.replace('Gasolina ', '').replace(' Oil', '')}
          </button>
        ))}
      </div>

      {tabActivo && (
        <p className="text-2xl font-bold text-slate-900">
          {litrosPorTipo[tabActivo].cantidad.toFixed(3)}{' '}
          {litrosPorTipo[tabActivo].unidad}
        </p>
      )}
    </>
  )}
</div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Transacciones</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{turnos.reduce((acc, t) => acc + (t.cantidad_ventas || 0), 0)}</p>
                </div>
            </div>

            {/* Lista de turnos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                    <h3 className="font-semibold text-slate-900">Turnos del día</h3>
                </div>
                <div className="overflow-x-auto">
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
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Detalle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500"></div>
                                            Cargando turnos...
                                        </div>
                                    </td>
                                </tr>
                            ) : turnos.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">No hay turnos registrados para esta fecha</td>
                                </tr>
                            ) : (
                                turnos.map(t => (
                                    <tr key={t.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-slate-800 font-medium">{t.operador || t.operador_nombre || 'N/A'}</td>
                                        <td className="px-4 py-3 text-gray-600">Isla {t.isla || 'N/A'}</td>
                                        <td className="px-4 py-3 text-gray-600">{t.horario || 'N/A'}</td>
                                        <td className="px-4 py-3 text-gray-600 text-xs">{t.fecha_apertura ? new Date(t.fecha_apertura).toLocaleTimeString('es-BO') : 'N/A'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${t.estado === 'ABIERTO' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {t.estado || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{t.cantidad_ventas || 0}</td>
                                        <td className="px-4 py-3 font-semibold text-emerald-600">Bs. {(t.total_ventas || 0).toFixed(2)}</td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => verVentas(t)}
                                                className="text-xs text-blue-600 hover:text-blue-800"
                                            >
                                                Ver ventas
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detalle de ventas del turno seleccionado */}
            {turnoSeleccionado && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900">
                            Ventas — {turnoSeleccionado.operador || turnoSeleccionado.operador_nombre} / Isla {turnoSeleccionado.isla} / {turnoSeleccionado.horario}
                        </h3>
                        <button onClick={() => setTurnoSeleccionado(null)} className="text-xs text-gray-400 hover:text-gray-600">Cerrar</button>
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
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Hora</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loadingVentas ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-6 text-center text-gray-400 text-sm">Cargando...</td>
                                    </tr>
                                ) : ventas.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-6 text-center text-gray-400 text-sm">No hay ventas en este turno</td>
                                    </tr>
                                ) : (
                                    ventas.map(v => (
                                        <tr key={v.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-mono text-xs text-gray-600">{v.numero_comprobante}</td>
                                            <td className="px-4 py-3 text-gray-600">Lado {v.lado_nombre}</td>
                                            <td className="px-4 py-3 text-gray-800">{v.tipo_combustible_nombre}</td>
                                            <td className="px-4 py-3 text-gray-800">{v.litros} Lt</td>
                                            <td className="px-4 py-3 font-semibold text-emerald-600">Bs. {v.total}</td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">{v.metodo_pago}</span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-500">{new Date(v.fecha_hora).toLocaleTimeString('es-BO')}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
export const backupService = {
    descargar: () => apiClient.get('/backup/descargar/', { responseType: 'blob' }),
    restaurar: (archivo) => {
        const formData = new FormData();
        formData.append('archivo', archivo);
        return apiClient.post('/backup/restaurar/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};
function BackupModule() {
    const [loading, setLoading] = useState(false);
    const [loadingRestore, setLoadingRestore] = useState(false);
    const [error, setError] = useState(null);
    const [exito, setExito] = useState(null);
    const [archivoRestore, setArchivoRestore] = useState(null);

    const handleDescargar = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await backupService.descargar();
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const fecha = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
            link.setAttribute('download', `backup_${fecha}.sql`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            setExito('Backup descargado correctamente');
        } catch (err) {
            setError('Error al generar el backup');
        } finally {
            setLoading(false);
        }
    };

    const handleRestaurar = async () => {
        if (!archivoRestore) {
            setError('Selecciona un archivo .sql para restaurar');
            return;
        }
        if (!confirm('¿Estás seguro? Esta acción reemplazará todos los datos actuales de la base de datos.')) return;
        setLoadingRestore(true);
        setError(null);
        try {
            await backupService.restaurar(archivoRestore);
            setExito('Base de datos restaurada correctamente');
            setArchivoRestore(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al restaurar el backup');
        } finally {
            setLoadingRestore(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Backup y Restauración</h2>
                <p className="text-sm text-gray-500 mt-1">Gestiona las copias de seguridad de la base de datos</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}
            {exito && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
                    <p className="text-emerald-700 text-sm">{exito}</p>
                </div>
            )}

            {/* Tarjeta Backup */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                <div>
                    <h3 className="font-semibold text-slate-900 text-lg">Generar Backup</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Descarga una copia completa de la base de datos en formato <span className="font-mono text-xs bg-gray-100 px-1 rounded">.sql</span>. Guarda este archivo en un lugar seguro.
                    </p>
                </div>
                <Button onClick={handleDescargar} loading={loading} fullWidth={false} size="small">
                    Descargar Backup
                </Button>
            </div>

            {/* Tarjeta Restore */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                <div>
                    <h3 className="font-semibold text-slate-900 text-lg">Restaurar Backup</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Sube un archivo <span className="font-mono text-xs bg-gray-100 px-1 rounded">.sql</span> generado previamente. <span className="text-red-600 font-medium">Esta acción reemplazará todos los datos actuales.</span>
                    </p>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                            Seleccionar archivo .sql
                        </label>
                        <input
                            type="file"
                            accept=".sql"
                            onChange={(e) => {
                                setArchivoRestore(e.target.files[0]);
                                setError(null);
                                setExito(null);
                            }}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
                        />
                    </div>
                    {archivoRestore && (
                        <p className="text-xs text-gray-500">
                            Archivo seleccionado: <span className="font-medium text-slate-700">{archivoRestore.name}</span>
                        </p>
                    )}
                    <Button
                        onClick={handleRestaurar}
                        loading={loadingRestore}
                        fullWidth={false}
                        size="small"
                        className="!bg-red-600 hover:!bg-red-700"
                    >
                        Restaurar Base de Datos
                    </Button>
                </div>
            </div>
        </div>
    );
}
function AdminPanel() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header showNav={false} showUserMenu variant="light" fixed={false} adminMode />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <Routes>
            <Route path="/" element={<Navigate to="usuarios" replace />} />
            <Route path="usuarios" element={<UsuariosModule />} />
            <Route path="clientes-limites" element={<ClientesLimitesModule />} />
            <Route path="predicciones-ia" element={<PrediccionesIAModule />} />
            <Route path="roles" element={<RolesModule />} />
            <Route path="permisos" element={<PermisosModule />} />
            <Route path="sucursales" element={<SucursalesModule />} />
            <Route path="turnos" element={<TurnosAdminModule />} />
            <Route path="bitacora" element={<BitacoraModule />} />
            <Route path="backup" element={<BackupModule />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export { BitacoraModule };
export default AdminPanel;
