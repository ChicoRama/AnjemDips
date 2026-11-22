/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';

const TOKEN_KEY = 'anjemdips_token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Pulihkan sesi dari token yang tersimpan saat aplikasi pertama kali dibuka
  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (!cancelled) setUser(res.data.user);
      } catch (err) {
        // Hanya hapus token bila server menyatakan token tidak valid.
        // Jika hanya gagal jaringan, token tetap disimpan agar bisa dicoba lagi.
        if (err.response?.status === 401 || err.response?.status === 404) {
          localStorage.removeItem(TOKEN_KEY);
        }
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyAuthResponse = useCallback((data) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback(
    async (email, password) => {
      const res = await api.post('/auth/login', { email, password });
      return applyAuthResponse(res.data);
    },
    [applyAuthResponse]
  );

  const register = useCallback(
    async (payload) => {
      const res = await api.post('/auth/register', payload);
      return applyAuthResponse(res.data);
    },
    [applyAuthResponse]
  );

  // Gabungkan data terbaru dari server (mis. status online / kendaraan) ke user aktif
  const updateUser = useCallback((patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, updateUser }),
    [user, loading, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth harus dipakai di dalam <AuthProvider>.');
  }
  return ctx;
}
