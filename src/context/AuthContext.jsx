import { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';
import { rolesService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Inicialización: verificar si hay sesión guardada
  useEffect(() => {
    const initAuth = () => {
      try {
        const token = localStorage.getItem('access_token');
        const storedUserStr = localStorage.getItem('user');
        
        if (token && storedUserStr) {
          const storedUser = JSON.parse(storedUserStr);
          setUser(storedUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      
      if (response && response.user) {
        let user = response.user;
        
        // Si roles es un array de números (IDs), obtener los detalles
        if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
          const primerRol = user.roles[0];
          
          if (typeof primerRol === 'number' || (typeof primerRol === 'string' && !primerRol.match(/[a-zA-Z]/))) {
            try {
              // Obtener todos los roles para mapear IDs a nombres
              const rolesResponse = await rolesService.getAll();
              const todosLosRoles = Array.isArray(rolesResponse.data) 
                ? rolesResponse.data 
                : rolesResponse.data.results || [];
              
              // Mapear los IDs del usuario a los nombres de roles
              const rolesExpandidos = user.roles.map(roleId => {
                const rolDetails = todosLosRoles.find(r => r.id === roleId);
                return rolDetails || { id: roleId, nombre: `Rol ${roleId}`, permisos: [] };
              });
              
              user = { ...user, roles: rolesExpandidos };
            } catch (error) {
              // Continuar sin expandir si hay error
            }
          }
        }
        
        setUser(user);
        setIsAuthenticated(true);
        return { success: true, user };
      } else {
        return { success: false, error: 'No user data in response' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
