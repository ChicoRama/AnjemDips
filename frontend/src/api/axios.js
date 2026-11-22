import axios from 'axios';

const TOKEN_KEY = 'anjemdips_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Otomatis sisipkan token JWT dari localStorage pada setiap request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Token kedaluwarsa/tidak valid -> bersihkan sesi dan arahkan ke halaman login.
// Request login/register dikecualikan agar pesan "password salah" tetap tampil.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthForm = url.includes('/auth/login') || url.includes('/auth/register');
    if (
      error.response?.status === 401 &&
      !isAuthForm &&
      localStorage.getItem(TOKEN_KEY)
    ) {
      localStorage.removeItem(TOKEN_KEY);
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
