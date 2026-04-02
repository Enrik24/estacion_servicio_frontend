import apiClient from './api';

// Función para limpiar tokens expirados
const clearExpiredTokens = () => {
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  
  if (accessToken || refreshToken) {
    console.log('Limpiando tokens potencialmente expirados...');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }
};

/**
 * Servicio de Autenticación
 * Maneja login, logout, verificación y refresco de tokens
 */
export const authService = {
  login: async (credentials) => {
    clearExpiredTokens();
    
    console.log('=== LOGIN SERVICE - Sending request ===');
    console.log('Credentials:', credentials);
    
    const response = await apiClient.post('/auth/login/', credentials);
    
    console.log('=== LOGIN SERVICE - Response received ===');
    console.log('Response data:', response.data);
    
    const { access, refresh, user } = response.data;
    
    if (!access) {
      console.error('=== LOGIN SERVICE - ERROR: No access token in response ===');
      throw new Error('No access token received from server');
    }
    
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(user));
    
    console.log('=== LOGIN SERVICE - Tokens saved to localStorage ===');
    console.log('All localStorage keys after save:', Object.keys(localStorage));
    
    return response.data;
  },

  logout: async () => {
    try {
      // Solo llamar al backend si hay token
      const token = localStorage.getItem('access_token');
      if (token) {
        await apiClient.post('/auth/logout/');
      }
    } catch (error) {
      // Ignorar errores 401 (token ya expirado o inválido)
      if (error.response?.status !== 401) {
        console.error('Error en logout:', error);
      }
    } finally {
      // Siempre limpiar localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },

  verifyToken: async (token) => {
    return apiClient.post('/token/verify/', { token });
  },

  refreshToken: async (refresh) => {
    return apiClient.post('/token/refresh/', { refresh });
  },

  // Utilidad para verificar si hay sesión activa
  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },

  // Obtener usuario actual
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};

export default authService;
