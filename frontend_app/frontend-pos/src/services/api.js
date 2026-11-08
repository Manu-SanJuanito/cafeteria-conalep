import axios from 'axios';

// En tu compu (sin archivo .env) sigue apuntando a tu Django local de siempre.
// En Vercel/Netlify defines VITE_API_URL como variable de entorno con la URL
// real de tu backend en Railway/Render, ej: https://tu-app.up.railway.app/api
const baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Instancia centralizada de Axios apuntando al backend de Django
const API = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor inteligente: si el alumno ya inició sesión, inyecta el Token de DRF automáticamente
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;
