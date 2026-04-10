import { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { rolesService, permisosService } from '../../services/api';
import bitacoraService from '../../services/bitacoraService';

export default function RolesModule() {
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
        
        // Registrar UPDATE en bitácora
        await bitacoraService.registrar(
          'UPDATE',
          'Roles',
          `Se actualizó el rol: ${formData.nombre}`,
          {
            rol_id: editingRole.id,
            nombre_rol: formData.nombre,
            descripcion: formData.descripcion,
            permisos_asignados: formData.permisos?.length || 0
          }
        );
      } else {
        const response = await rolesService.create(formData);
        
        // Registrar CREATE en bitácora
        await bitacoraService.registrar(
          'CREATE',
          'Roles',
          `Se creó un nuevo rol: ${formData.nombre}`,
          {
            rol_id: response.data?.id,
            nombre_rol: formData.nombre,
            descripcion: formData.descripcion,
            permisos_asignados: formData.permisos?.length || 0
          }
        );
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
        const roleToDelete = roles.find(r => r.id === id);
        await rolesService.delete(id);
        
        // Registrar DELETE en bitácora
        await bitacoraService.registrar(
          'DELETE',
          'Roles',
          `Se eliminó el rol: ${roleToDelete?.nombre}`,
          {
            rol_id: id,
            nombre_rol: roleToDelete?.nombre,
            descripcion: roleToDelete?.descripcion
          }
        );
        
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
