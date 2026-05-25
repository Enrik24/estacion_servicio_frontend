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
  Gauge,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Fuel,
  Clock,
  ShoppingCart,
  Building2,
  Wallet,
  Database,
  BarChart3,
  Activity,
  Droplets,
  FileText
} from 'lucide-react';
function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [adminExpanded, setAdminExpanded] = useState(true);
  const [ventasExpanded, setVentasExpanded] = useState(true);
  const [sucursalesExpanded, setSucursalesExpanded] = useState(true);
  const [reportingExpanded, setReportingExpanded] = useState(true);
  const [monitoreoExpanded, setMonitoreoExpanded] = useState(true);
  const [combustibleExpanded, setCombustibleExpanded] = useState(true); 
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
  
  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/gerente');
  const isVentasRoute = location.pathname.startsWith('/ventas');
  const isSucursalesRoute = location.pathname.startsWith('/admin/sucursales');
  const isReportesRoute = location.pathname.startsWith('/reportes');
  
  const menuItems = [
    { path: '/home', label: 'Dashboard', icon: LayoutDashboard },
  ];

  const adminSubModules = [
    { path: '/admin/usuarios', label: 'Usuarios', icon: Users },
    { path: '/admin/clientes-limites', label: 'Clientes y Límites', icon: Gauge },
    { path: '/admin/predicciones-ia', label: 'Predicciones IA', icon: TrendingUp },
    { path: '/admin/roles', label: 'Roles', icon: UserCog },
    { path: '/admin/permisos', label: 'Permisos', icon: Key },
    { path: '/admin/bitacora', label: 'Bitácora del sistema', icon: ClipboardList },
    { path: '/admin/backup', label: 'Backup y Restauración', icon: Database },
  ];
  const gerenteSubModules = [
    { path: '/gerente/usuarios', label: 'Usuarios', icon: Users },
    { path: '/gerente/clientes-limites', label: 'Clientes y Límites', icon: Gauge },
    { path: '/gerente/predicciones-ia', label: 'Predicciones IA', icon: TrendingUp },
    { path: '/gerente/roles', label: 'Roles', icon: UserCog },
    { path: '/gerente/permisos', label: 'Permisos', icon: Key },
    { path: '/gerente/bitacora', label: 'Bitácora del sistema', icon: ClipboardList },
    { path: '/monitoreo', label: 'Monitoreo Surtidores', icon: Activity },
];
 const ventasSubModules = [
    { path: '/ventas/turno', label: 'Turno', icon: Clock },
    { path: '/ventas/registrar', label: 'Registrar venta', icon: ShoppingCart },
];
  const sucursalesSubModules = [
      { path: '/admin/sucursales', label: 'Sucursales', icon: Building2 },
  ];
  const monitoreoSubModules = [
    { path: '/monitoreo', label: 'Surtidores', icon: Activity },
];

const combustibleSubModules = [
    { path: '/inventario/tanques', label: 'Niveles de Tanques', icon: Fuel },
];
  const reportingSubModules = [
      { path: '/reportes', label: 'Reportes', icon: FileText },
  ];
  return (
    <aside className={`bg-slate-900 text-white transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} min-h-screen flex flex-col flex-shrink-0`}>
      <div className="p-4 flex items-center justify-between">
        {!collapsed && (
          <h1 className="text-lg font-bold">
            <span className="text-white">Surtidor</span>
            
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

        {['operador'].includes(userRole) && (
  <div className="pt-4 mt-4 border-t border-slate-800">
    {!collapsed ? (
      <>
        <button
          onClick={() => setVentasExpanded(!ventasExpanded)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${isVentasRoute ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:bg-slate-800 hover:text-white'}`}
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
                  `flex items-center space-x-3 px-3 py-2 rounded-lg transition ${isActive ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'}`
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
          `flex items-center justify-center px-3 py-2 rounded-lg transition ${isActive ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'}`
        }
      >
        <Fuel className="w-5 h-5 flex-shrink-0" />
      </NavLink>
    )}
  </div>
)}
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
{['administrador', 'gerente'].includes(userRole) && (
          <div className="pt-4 mt-4 border-t border-slate-800">
            {!collapsed ? (
              <div className="space-y-1">
                <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Auditoría de Caja
                </p>
                
                {/* Enlace original a Turnos */}
                <NavLink
    to={userRole === 'gerente' ? '/gerente/turnos' : '/admin/turnos'}
  className={({ isActive }) =>
    `flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
      isActive ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'
    }`
  }
>
  <ShoppingCart className="w-5 h-5 flex-shrink-0" />
  <span className="text-sm font-medium">Historial Turnos</span>
</NavLink>

                {/* NUEVO: Enlace a Consolidación (CU8) */}
                <NavLink
                  to={userRole === 'gerente' ? '/gerente/consolidacion' : '/admin/consolidacion'}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
                      isActive ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <Wallet className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Consolidar Caja</span>
                </NavLink>
              </div>
            ) : (
              <div className="space-y-2">
                <NavLink
                  to={userRole === 'gerente' ? '/gerente/turnos' : '/admin/turnos'}
                  className={({ isActive }) =>
                    `flex items-center justify-center px-3 py-2 rounded-lg transition ${
                      isActive ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <ShoppingCart className="w-5 h-5 flex-shrink-0" />
                </NavLink>
                <NavLink
                  to={userRole === 'gerente' ? '/gerente/consolidacion' : '/admin/consolidacion'}
                  className={({ isActive }) =>
                    `flex items-center justify-center px-3 py-2 rounded-lg transition ${
                      isActive ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <Wallet className="w-5 h-5 flex-shrink-0" />
                </NavLink>
              </div>
            )}
          </div>
        )}
        {/* Monitoreo y Control */}
{['administrador', 'gerente'].includes(userRole) && (
    <div className="pt-4 mt-4 border-t border-slate-800">
        {!collapsed ? (
            <>
                <button
                    onClick={() => setMonitoreoExpanded(!monitoreoExpanded)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                        location.pathname.startsWith('/monitoreo') ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                    }`}
                >
                    <div className="flex items-center space-x-3">
                        <Activity className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-medium">Monitoreo y Control</span>
                    </div>
                    {monitoreoExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {monitoreoExpanded && (
                    <div className="mt-1 ml-4 pl-4 border-l border-slate-700 space-y-1">
                        {monitoreoSubModules.map((item) => (
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
                to="/monitoreo"
                className={({ isActive }) =>
                    `flex items-center justify-center px-3 py-2 rounded-lg transition ${
                        isActive ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                    }`
                }
            >
                <Activity className="w-5 h-5 flex-shrink-0" />
            </NavLink>
        )}
    </div>
)}

{/* Control de Combustible */}
{['administrador', 'gerente'].includes(userRole) && (
    <div className="pt-4 mt-4 border-t border-slate-800">
        {!collapsed ? (
            <>
                <button
                    onClick={() => setCombustibleExpanded(!combustibleExpanded)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                        location.pathname.startsWith('/inventario') ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                    }`}
                >
                    <div className="flex items-center space-x-3">
                        <Droplets className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-medium">Control de Combustible</span>
                    </div>
                    {combustibleExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {combustibleExpanded && (
                    <div className="mt-1 ml-4 pl-4 border-l border-slate-700 space-y-1">
                        {combustibleSubModules.map((item) => (
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
                to="/inventario/tanques"
                className={({ isActive }) =>
                    `flex items-center justify-center px-3 py-2 rounded-lg transition ${
                        isActive ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                    }`
                }
            >
                <Droplets className="w-5 h-5 flex-shrink-0" />
            </NavLink>
        )}
    </div>
)}
        {/* Inteligencia de Negocio, Reporting */}
        {['administrador', 'gerente', 'auditor'].includes(userRole) && (
    <div className="pt-4 mt-4 border-t border-slate-800">
        {!collapsed ? (
            <>
                <button
                    onClick={() => setReportingExpanded(!reportingExpanded)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                        isReportesRoute ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                    }`}
                >
                    <div className="flex items-center space-x-3">
                        <BarChart3 className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-medium">Inteligencia de Negocio</span>
                    </div>
                    {reportingExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {reportingExpanded && (
                    <div className="mt-1 ml-4 pl-4 border-l border-slate-700 space-y-1">
                        {reportingSubModules.map((item) => (
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
                to="/reportes"
                className={({ isActive }) =>
                    `flex items-center justify-center px-3 py-2 rounded-lg transition ${
                        isActive ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                    }`
                }
            >
                <BarChart3 className="w-5 h-5 flex-shrink-0" />
            </NavLink>
        )}
    </div>
)}
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
                        {(userRole === 'gerente' ? gerenteSubModules : adminSubModules).map((item) => (
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
                to={userRole === 'gerente' ? '/gerente/usuarios' : '/admin/usuarios'}
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