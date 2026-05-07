import { useState } from 'react';
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
  ChevronDown,
  ChevronUp
} from 'lucide-react';

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [adminExpanded, setAdminExpanded] = useState(true);
  const location = useLocation();
  
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  const menuItems = [
    { path: '/home', label: 'Dashboard', icon: LayoutDashboard },
  ];

  const adminSubModules = [
    { path: '/admin/usuarios', label: 'Usuarios', icon: Users },
    { path: '/admin/clientes-limites', label: 'Clientes y Límites', icon: Gauge },
    { path: '/admin/roles', label: 'Roles', icon: UserCog },
    { path: '/admin/permisos', label: 'Permisos', icon: Key },
    { path: '/admin/bitacora', label: 'Bitácora del sistema', icon: ClipboardList },
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
        
        {/* Administración y Seguridad Module */}
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
