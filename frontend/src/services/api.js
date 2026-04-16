import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  response => response,
  error => {
    const { status, config } = error.response || {};
    const isLoginPage = window.location.pathname.includes('/login');
    const isAdminPath = window.location.pathname.startsWith('/admin');

    if (status === 401 && !isLoginPage) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      if (isAdminPath) {
        window.location.href = '/admin/login';
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
