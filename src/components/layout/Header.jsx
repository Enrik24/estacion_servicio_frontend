import { useState, useEffect, useRef } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { ArrowRight, User, Settings, LogOut, ChevronDown, Menu, X, Bell, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '../../services/api';
import { usePuedeAccederAdmin } from '../../hooks/usePermiso';

function Header({ 
  showNav = true, 
  variant = 'light',
  transparent = false,
  showUserMenu = false,
  showAuthButtons = false,
  fixed = true,
  adminMode = false,
  onLogout = null
}) {
  const navigate = useNavigate();
  console.log('[Header.render] Starting render...');
  const puedeAccederAdmin = usePuedeAccederAdmin(); // ← Llamar aquí al inicio
  console.log('[Header.render] puedeAccederAdmin retornado:', puedeAccederAdmin);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState('Usuario');
  const [userRole, setUserRole] = useState('');
  const dropdownRef = useRef(null);

  console.log('[Header] puedeAccederAdmin:', puedeAccederAdmin);
  console.log('[Header] showUserMenu:', showUserMenu);
  console.log('[Header] adminMode:', adminMode);

  useEffect(() => {
    // Read user from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.nombre || user.email || 'Usuario');
        const roleName = user.roles_detalle?.[0]?.nombre || user.rol || '';
        setUserRole(roleName);
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
      }
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    console.log('=== HANDLE LOGOUT - Iniciando ===');
    setDropdownOpen(false);
    try {
      console.log('=== HANDLE LOGOUT - Llamando authService.logout ===');
      await authService.logout();
      console.log('=== HANDLE LOGOUT - authService.logout completado ===');
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      console.log('=== HANDLE LOGOUT - Navegando a / ===');
      // Notificar al componente padre que se cerró sesión
      if (onLogout) {
        onLogout();
      }
      navigate('/', { replace: true });
    }
  };

  const bgStyles = variant === 'dark' || (transparent && !scrolled)
    ? 'bg-slate-900/50' 
    : scrolled 
      ? 'bg-slate-900 shadow-lg' 
      : (variant === 'light' ? 'bg-white/95 shadow-sm' : 'bg-slate-900');

  const textStyles = variant === 'dark' || scrolled || (transparent && !scrolled)
    ? 'text-white' 
    : 'text-slate-900';

  const linkStyles = variant === 'dark' || scrolled || (transparent && !scrolled)
    ? 'text-white hover:text-orange-500' 
    : 'text-gray-600 hover:text-slate-900';

  return (
    <header className={`${fixed ? 'fixed top-0 left-0 right-0' : 'relative'} z-50 transition-all duration-300 ${bgStyles}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div 
            className="flex items-center cursor-pointer"
            onClick={() => navigate('/')}
          >
            <h1 className="text-2xl font-bold">
              <span className={variant === 'dark' || scrolled || (transparent && !scrolled) ? 'text-white' : 'text-slate-900'}>Surtidor</span>
              <span className="text-emerald-500">Bolivia</span>
            </h1>
          </div>
          
          {showNav && (
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#soporte" className={`${linkStyles} transition`}>Soporte</a>
              <a href="#sucursales" className={`${linkStyles} transition`}>Sucursales</a>
              <a href="#servicios" className={`${linkStyles} transition`}>Servicios</a>
            </nav>
          )}

          {showUserMenu ? (
            <div className="flex items-center space-x-2">
              {/* Notification bell - outside avatar button */}
              <button 
                className="p-2 hover:bg-slate-700 rounded-full transition"
                onClick={() => {
                  // TODO: Open notifications panel
                }}
              >
                <Bell className="w-5 h-5 text-white" />
              </button>
              
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-3 hover:bg-slate-800 px-3 py-2 rounded-lg transition"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{userName}</p>
                      <p className="text-xs text-gray-400">{userRole}</p>
                    </div>
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-slate-900 font-bold">
                        {userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-white transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 border border-gray-200"
                    >
                      {adminMode ? (
                        <>
                          <button
                            onClick={() => navigate('/')}
                            className="w-full px-4 py-2 text-left flex items-center space-x-3 hover:bg-gray-50 transition"
                          >
                            <ArrowLeft className="w-4 h-4 text-gray-600" />
                            <span className="text-gray-700">Regresar</span>
                          </button>
                          <div className="border-t border-gray-200 my-2"></div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('=== BOTÓN CERRAR SESIÓN ADMIN - Click detectado ===');
                              handleLogout();
                            }}
                            className="w-full px-4 py-2 text-left flex items-center space-x-3 hover:bg-red-50 transition"
                          >
                            <LogOut className="w-4 h-4 text-red-500" />
                            <span className="text-red-500">Cerrar Sesión</span>
                          </button>
                        </>
                      ) : (
                          <>
                            <button
                              onClick={() => navigate('/profile')}
                              className="w-full px-4 py-2 text-left flex items-center space-x-3 hover:bg-gray-50 transition"
                            >
                              <User className="w-4 h-4 text-gray-600" />
                              <span className="text-gray-700">Perfil</span>
                            </button>
                            {puedeAccederAdmin && (
                              <>
                                <div className="border-t border-gray-200 my-2"></div>
                                <button
                                  onClick={() => navigate('/admin')}
                                  className="w-full px-4 py-2 text-left flex items-center space-x-3 hover:bg-gray-50 transition"
                                >
                                  <Settings className="w-4 h-4 text-gray-600" />
                                  <span className="text-gray-700">Panel Admin</span>
                                </button>
                              </>
                            )}
                            <div className="border-t border-gray-200 my-2"></div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('=== BOTÓN CERRAR SESIÓN USER - Click detectado ===');
                                handleLogout();
                              }}
                              className="w-full px-4 py-2 text-left flex items-center space-x-3 hover:bg-red-50 transition"
                            >
                              <LogOut className="w-4 h-4 text-red-500" />
                              <span className="text-red-500">Cerrar Sesión</span>
                            </button>
                          </>
                        )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : showAuthButtons ? (
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 border border-white text-white rounded-lg hover:bg-white hover:text-slate-900 transition"
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
              >
                Crear Cuenta
              </button>
            </div>
          ) : (
            <button 
              onClick={() => navigate('/login')}
              className={`hidden md:flex items-center space-x-1 font-semibold ${linkStyles} transition`}
            >
              <span>Ingresar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className={`w-6 h-6 ${textStyles}`} />
            ) : (
              <Menu className={`w-6 h-6 ${textStyles}`} />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-700">
            <nav className="flex flex-col space-y-4">
              <a href="#soporte" className={`${linkStyles} transition`}>Soporte</a>
              <a href="#sucursales" className={`${linkStyles} transition`}>Sucursales</a>
              <a href="#servicios" className={`${linkStyles} transition`}>Servicios</a>
              <button 
                onClick={() => navigate('/login')}
                className={`text-left font-semibold ${linkStyles} transition`}
              >
                Ingresar
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
