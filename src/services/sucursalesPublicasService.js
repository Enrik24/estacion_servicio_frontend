import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Sin token, sin autenticación — endpoint público
export const sucursalesPublicasService = {
  getAll: () => axios.get(`${API_BASE_URL}/sucursales-publicas/`),
};
