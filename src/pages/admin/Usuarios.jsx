import { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { usuariosService, rolesService, bitacoraService } from '../../services/api';
import { usePermiso } from '../../hooks/usePermiso';

export default function UsuariosModule() {
  // Validar permisos
  const puedeVer = usePermiso('usuarios.ver');
  const puedeCrear = usePermiso('usuarios.crear');
  const puedeEditar = usePermiso('usuarios.editar');
  const puedeEliminar = usePermiso('usuarios.eliminar');

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
    if (puedeVer) {
      loadUsers();
      loadRoles();
    } else {
      setLoading(false);
    }
  }, [puedeVer]);

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
        const userToDelete = users.find(u => u.id === id);
        await usuariosService.delete(id);
        
        await loadUsers();
      } catch (err) {
        alert('Error al eliminar usuario');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Validar permiso de lectura */}
      {!puedeVer && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">!</span>
            </div>
            <h3 className="text-lg font-semibold text-red-900">Acceso Denegado</h3>
          </div>
          <p className="text-sm text-red-700">
            No tienes permiso para acceder a la gestión de usuarios. 
            Contacta al administrador del sistema si necesitas acceso.
          </p>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-slate-900">Gestión de Usuarios</h2>
        {puedeVer && (
          <div className="mt-4">
            <Button 
              onClick={() => { setEditingUser(null); setFormData({ nombre: '', email: '', rol: '', is_active: true, password: '', confirmPassword: '' }); setShowModal(true); }} 
              fullWidth={false} 
              size="small"
              disabled={!puedeCrear}
              title={!puedeCrear ? 'No tienes permiso para crear usuarios' : ''}
            >
              Nuevo Usuario
            </Button>
          </div>
        )}
      </div>

      {puedeVer && (
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
                    {puedeEditar && (
                      <button onClick={() => handleEdit(user)} className="text-blue-600 hover:text-blue-800 text-sm" title="Editar usuario">Editar</button>
                    )}
                    {puedeEliminar && (
                      <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-800 text-sm" title="Eliminar usuario">Eliminar</button>
                    )}
                    {!puedeEditar && !puedeEliminar && (
                      <span className="text-gray-400 text-sm">Sin acciones</span>
                    )}
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

      )}

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
