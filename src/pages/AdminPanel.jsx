import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { usuariosService, rolesService, permisosService, bitacoraService } from '../services/api';

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
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
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
                  className={`px-3 py-1 text-sm rounded ${
                    currentPage === page
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
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                required
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
              {editingUser && (
                <>
                  <Input
                    label="Contraseña (opcional - dejar en blanco para mantener actual)"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                  <Input
                    label="Confirmar Contraseña"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  />
                </>
              )}
              {!editingUser && (
                <>
                  <Input
                    label="Contraseña"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                  <Input
                    label="Confirmar Contraseña"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    required
                  />
                </>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Rol</label>
                <select
                  value={formData.rol}
                  onChange={(e) => setFormData({...formData, rol: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, is_active: e.target.value === 'Activo'})}
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
                  onClick={() => { setEditingRole(role); setFormData({...role, permisos: role.permisos || []}); setShowModal(true); }}
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
                className={`px-3 py-1 text-sm rounded ${
                  currentPage === page
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
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                required
              />
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const response = await permisosService.getAll();
      const permsData = Array.isArray(response.data) ? response.data : response.data.results || [];
      setPermissions(permsData);
      setCurrentPage(1);
    } catch (err) {
      console.error('Error loading permissions:', err);
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

  // Group permissions by module first
  const groupedPerms = permissions.reduce((acc, perm) => {
    const modulo = perm.modulo || 'General';
    if (!acc[modulo]) acc[modulo] = [];
    acc[modulo].push(perm);
    return acc;
  }, {});

  // Pagination logic - flatten grouped permissions
  const flatPerms = Object.entries(groupedPerms).flatMap(([modulo, perms]) =>
    perms.map(p => ({ ...p, modulo }))
  );
  const totalPages = Math.ceil(flatPerms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPerms = flatPerms.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Gestión de Permisos</h2>
        <div className="mt-4">
          <Button onClick={() => setShowModal(true)} fullWidth={false} size="small">Nuevo Permiso</Button>
        </div>
      </div>

      <div className="space-y-6">
        {paginatedPerms.map((perm) => (
          <div key={perm.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl flex justify-between">
              <h3 className="font-semibold text-slate-900">{perm.modulo}</h3>
            </div>
            <div className="divide-y divide-gray-200">
              <div className="px-6 py-4 flex justify-between items-center hover:bg-gray-50">
                <div>
                  <h4 className="font-medium text-slate-900">{perm.nombre}</h4>
                  <p className="text-sm text-gray-600">{perm.descripcion}</p>
                  {perm.codigo && <p className="text-xs text-gray-400 mt-1">Código: {perm.codigo}</p>}
                </div>
                <div className="space-x-2">
                  <button 
                    onClick={() => handleEdit(perm)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDelete(perm.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination for Permissions */}
      {flatPerms.length > itemsPerPage && (
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-gray-500">
            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, flatPerms.length)} de {flatPerms.length} registros
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
                className={`px-3 py-1 text-sm rounded ${
                  currentPage === page
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
            <h3 className="text-xl font-bold mb-4">{editingPerm ? 'Editar Permiso' : 'Nuevo Permiso'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingPerm && (
                <Input
                  label="Código"
                  value={formData.codigo}
                  onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                  placeholder="ej: usuarios.view"
                  required
                />
              )}
              <Input
                label="Nombre del Permiso"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                required
              />
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                  required
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
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({ usuario: '', modulo: '', fecha: '' });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.usuario) params.usuario = filter.usuario;
      if (filter.modulo) params.modulo = filter.modulo;
      if (filter.fecha) params.fecha = filter.fecha;
      
      const response = await bitacoraService.getAll(params);
      const logsData = Array.isArray(response.data) ? response.data : response.data.results || [];
      setLogs(logsData);
      setCurrentPage(1);
    } catch (err) {
      console.error('Error loading logs:', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    loadLogs();
  };

  const filteredLogs = logs.filter(log => 
    (filter.usuario === '' || (log.usuario_nombre?.toLowerCase() || '').includes(filter.usuario.toLowerCase())) &&
    (filter.fecha === '' || (log.fecha_hora || '').startsWith(filter.fecha))
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Bitácora del Sistema</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 grid md:grid-cols-3 gap-4">
          <Input
            type="text"
            placeholder="Filtrar por usuario..."
            value={filter.usuario}
            onChange={(e) => setFilter({...filter, usuario: e.target.value})}
          />
          <Input
            type="date"
            value={filter.fecha}
            onChange={(e) => setFilter({...filter, fecha: e.target.value})}
          />
          <Button onClick={handleFilter}>Filtrar</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fecha/Hora</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Usuario</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Acción</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">IP</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">{log.fecha_hora ? new Date(log.fecha_hora).toLocaleString('es-ES') : '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{log.usuario_nombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{log.usuario_email}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{log.accion}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">{log.ip_address}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      log.estado === 'EXITO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {log.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination for Bitácora */}
        {filteredLogs.length > itemsPerPage && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredLogs.length)} de {filteredLogs.length} registros
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
                  className={`px-3 py-1 text-sm rounded ${
                    currentPage === page
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
            <Route path="roles" element={<RolesModule />} />
            <Route path="permisos" element={<PermisosModule />} />
            <Route path="bitacora" element={<BitacoraModule />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default AdminPanel;
