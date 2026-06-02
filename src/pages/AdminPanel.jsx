import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import UsuariosModule from './admin/Usuarios';
import RolesModule from './admin/Roles';
import PermisosModule from './admin/Permisos';
import BitacoraModule from './admin/Bitacora';
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

export { RolesModule, PermisosModule, BitacoraModule, TurnosAdminModule };
export default AdminPanel;
