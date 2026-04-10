import { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { permisosService } from '../../services/api';
import bitacoraService from '../../services/bitacoraService';

export default function PermisosModule() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPerm, setEditingPerm] = useState(null);
  const [formData, setFormData] = useState({ codigo: '', nombre: '', descripcion: '', modulo: '' });
  
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
        
        // Registrar UPDATE en bitácora
        await bitacoraService.registrar(
          'UPDATE',
          'Permisos',
          `Se actualizó el permiso: ${formData.nombre}`,
          {
            permiso_id: editingPerm.id,
            codigo: formData.codigo,
            nombre_permiso: formData.nombre,
            descripcion: formData.descripcion,
            modulo: formData.modulo
          }
        );
      } else {
        const response = await permisosService.create(formData);
        
        // Registrar CREATE en bitácora
        await bitacoraService.registrar(
          'CREATE',
          'Permisos',
          `Se creó un nuevo permiso: ${formData.nombre}`,
          {
            permiso_id: response.data?.id,
            codigo: formData.codigo,
            nombre_permiso: formData.nombre,
            descripcion: formData.descripcion,
            modulo: formData.modulo
          }
        );
      }
      await loadPermissions();
      setShowModal(false);
      setEditingPerm(null);
      setFormData({ codigo: '', nombre: '', descripcion: '', modulo: '' });
    } catch (err) {
      alert('Error al guardar permiso: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleEdit = (perm) => {
    setEditingPerm(perm);
    setFormData({ codigo: perm.codigo || '', nombre: perm.nombre, descripcion: perm.descripcion || '', modulo: perm.modulo || '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Está seguro de eliminar este permiso?')) {
      try {
        const permToDelete = permissions.find(p => p.id === id);
        await permisosService.delete(id);
        
        // Registrar DELETE en bitácora
        await bitacoraService.registrar(
          'DELETE',
          'Permisos',
          `Se eliminó el permiso: ${permToDelete?.nombre}`,
          {
            permiso_id: id,
            codigo: permToDelete?.codigo,
            nombre_permiso: permToDelete?.nombre,
            descripcion: permToDelete?.descripcion,
            modulo: permToDelete?.modulo
          }
        );
        
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
              <Input
                label="Módulo"
                value={formData.modulo}
                onChange={(e) => setFormData({...formData, modulo: e.target.value})}
                placeholder="ej: Usuarios, Roles, Permisos"
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
