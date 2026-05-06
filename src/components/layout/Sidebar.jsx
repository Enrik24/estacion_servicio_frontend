import { useState,useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ChevronLeft,
  ChevronRight,
  Shield,
  Users,
  UserCog,
  Key,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Fuel,
  Clock,
  ShoppingCart,
  Building2
} from 'lucide-react';
function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [adminExpanded, setAdminExpanded] = useState(true);
  const [ventasExpanded, setVentasExpanded] = useState(true);
  const [sucursalesExpanded, setSucursalesExpanded] = useState(true);
  const [userRole, setUserRole] = useState('');

useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            const rol = user.roles_detalle?.[0]?.nombre || '';
            setUserRole(rol.toLowerCase());
        } catch (e) {
            console.error('Error parsing user:', e);
        }
    }
}, []);
  const location = useLocation();
  
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isVentasRoute = location.pathname.startsWith('/ventas');
  const isSucursalesRoute = location.pathname.startsWith('/admin/sucursales');
  
  const menuItems = [
    { path: '/home', label: 'Dashboard', icon: LayoutDashboard },
  ];

  const adminSubModules = [
    { path: '/admin/usuarios', label: 'Usuarios', icon: Users },
    { path: '/admin/roles', label: 'Roles', icon: UserCog },
    { path: '/admin/permisos', label: 'Permisos', icon: Key },
    { path: '/admin/bitacora', label: 'Bitácora del sistema', icon: ClipboardList },
  ];

  const ventasSubModules = [
   { path: '/admin/turnos', label: 'Turnos y Ventas', icon: ShoppingCart },
  ];
  const sucursalesSubModules = [
      { path: '/admin/sucursales', label: 'Sucursales', icon: Building2 },
  ];
  return (
    <aside className={`bg-slate-900 text-white transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} min-h-screen flex flex-col flex-shrink-0`}>
      <div className="p-4 flex items-center justify-between">
        {!collapsed && (
          <h1 className="text-lg font-bold">
            <span className="text-white">Surtidor</span>
            <span className="text-emerald-400">Bo</span>
          </h1>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 hover:bg-slate-800 rounded"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
      
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
                isActive ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm">{item.label}</span>}
          </NavLink>
        ))}

        {/* Módulo Ventas */}
        <div className="pt-4 mt-4 border-t border-slate-800">
          {!collapsed ? (
            <>
              <button
                onClick={() => setVentasExpanded(!ventasExpanded)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                  isVentasRoute ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Fuel className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Ventas y POS</span>
                </div>
                {ventasExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {ventasExpanded && (
                <div className="mt-1 ml-4 pl-4 border-l border-slate-700 space-y-1">
                  {ventasSubModules.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) => 
                        `flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
                          isActive ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                        }`
                      }
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </>
          ) : (
            <NavLink
              to="/ventas/turno"
              className={({ isActive }) => 
                `flex items-center justify-center px-3 py-2 rounded-lg transition ${
                  isActive ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Fuel className="w-5 h-5 flex-shrink-0" />
            </NavLink>
          )}
        </div>
        {['administrador'].includes(userRole) && (
    <div className="pt-4 mt-4 border-t border-slate-800">
        {!collapsed ? (
            <>
                <button
                    onClick={() => setSucursalesExpanded(!sucursalesExpanded)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                        isSucursalesRoute ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                    }`}
                >
                    <div className="flex items-center space-x-3">
                        <Building2 className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-medium">Gestión de Sucursales</span>
                    </div>
                    {sucursalesExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {sucursalesExpanded && (
                    <div className="mt-1 ml-4 pl-4 border-l border-slate-700 space-y-1">
                        {sucursalesSubModules.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
                                        isActive ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                                    }`
                                }
                            >
                                <item.icon className="w-4 h-4 flex-shrink-0" />
                                <span className="text-sm">{item.label}</span>
                            </NavLink>
                        ))}
                    </div>
                )}
            </>
        ) : (
            <NavLink
                to="/admin/sucursales"
                className={({ isActive }) =>
                    `flex items-center justify-center px-3 py-2 rounded-lg transition ${
                        isActive ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                    }`
                }
            >
                <Building2 className="w-5 h-5 flex-shrink-0" />
            </NavLink>
        )}
    </div>
)}

        {/* Administración y Seguridad */}
        {['administrador', 'gerente', 'auditor'].includes(userRole) && (
        <div className="pt-4 mt-4 border-t border-slate-800">
          {!collapsed ? (
            <>
              <button
                onClick={() => setAdminExpanded(!adminExpanded)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                  isAdminRoute ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Administración y Seguridad</span>
                </div>
                {adminExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              {adminExpanded && (
                <div className="mt-1 ml-4 pl-4 border-l border-slate-700 space-y-1">
                  {adminSubModules.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) => 
                        `flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
                          isActive ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                        }`
                      }
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </>
          ) : (
            <NavLink
              to="/admin/usuarios"
              className={({ isActive }) => 
                `flex items-center justify-center px-3 py-2 rounded-lg transition ${
                  isActive ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Shield className="w-5 h-5 flex-shrink-0" />
            </NavLink>
        )}
        </div>
        )}
      </nav>
      
      {!collapsed && (
        <div className="p-4 border-t border-slate-800">
          <p className="text-xs text-gray-500">v1.0.0</p>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;