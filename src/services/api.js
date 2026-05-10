import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Cliente Axios configurado con interceptores
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor para agregar JWT token
apiClient.interceptors.request.use(
  (config) => {
    // No agregar token para rutas de autenticación
    if (config.url === '/auth/login/' || config.url === '/token/refresh/' || config.url === '/token/verify/') {
      return config;
    }
    
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor para manejar token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // No redirigir si ya estamos en login
      if (originalRequest.url === '/auth/login/' || window.location.pathname === '/login') {
        return Promise.reject(error);
      }
      
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await apiClient.post('/token/refresh/', {
            refresh: refreshToken,
          });

          const { access, refresh } = response.data;
          localStorage.setItem('access_token', access);
          if (refresh) {
            localStorage.setItem('refresh_token', refresh);
          }
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return apiClient(originalRequest);
        } else {
          // Sin refresh token, redirigir a login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // Falló el refresh, limpiar y redirigir
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// Re-exportar servicios para mantener compatibilidad
export { authService } from './authService.js';
export { usuariosService } from './usuariosService.js';
export { rolesService } from './rolesService.js';
export { permisosService } from './permisosService.js';
export { bitacoraService } from './bitacoraService.js';
export { ventasService} from './ventasService.js';
