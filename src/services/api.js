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
    // No agregar token para rutas de autenticación y recuperación de contraseña
    if (
      config.url === '/auth/login/' || 
      config.url === '/token/refresh/' || 
      config.url === '/token/verify/' ||
      config.url === '/auth/request-reset/' ||
      config.url === '/auth/register/' ||
      config.url === '/auth/resend-verification/' ||
      config.url?.includes('/auth/verify-account/') ||
      config.url?.includes('/auth/reset-password/')
    ) {
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

    // Si recibimos un 401 o la petición original era para refrescar el token y falló
    if (originalRequest.url === '/token/refresh/' || originalRequest.url?.includes('/token/refresh/')) {
      // Limpiamos todo el almacenamiento de sesión y local
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      sessionStorage.clear();
      
      // Opcional: Mostrar mensaje al usuario antes de redirigir
      alert('Sesión expirada, por favor inicia sesión nuevamente.');
      
      // Redirigir al login
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Si es un 401 y no hemos intentado reintentar aún
    if (error.response?.status === 401 && !originalRequest._retry) {
      // No redirigir ni reintentar si estamos en login
      if (originalRequest.url === '/auth/login/' || window.location.pathname === '/login') {
        return Promise.reject(error);
      }
      
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          // IMPORTANTE: Usamos 'axios.post' directamente en lugar de 'apiClient.post'
          // para evitar que esta petición pase por el interceptor y cause un bucle infinito
          const response = await axios.post(`${apiClient.defaults.baseURL}/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access, refresh } = response.data;
          
          localStorage.setItem('access_token', access);
          if (refresh) {
            localStorage.setItem('refresh_token', refresh);
          }
          
          // Actualizamos el token en la petición original y la reintentamos
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return apiClient(originalRequest);
        } else {
          throw new Error('No refresh token available');
        }
      } catch (refreshError) {
        // Si el refresh falla (ej. backend apagado, token expirado), limpiamos y redirigimos
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        sessionStorage.clear();
        
        alert('Sesión expirada, por favor inicia sesión nuevamente.');
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
export { clientesService } from './clientesService.js';
export { limitesConsumoService } from './limitesConsumoService.js';
export { prediccionesIAService } from './prediccionesIAService.js';
