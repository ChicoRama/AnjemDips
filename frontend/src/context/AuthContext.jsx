/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import api from '../api/axios';

const TOKEN_KEY = 'anjemdips_token';
const USER_CACHE_KEY = 'anjemdips_user';

const AuthContext = createContext(null);

function readCachedUser() {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    if (!raw) return null;

    const user = JSON.parse(raw);
    if (!user?.id || !['customer', 'driver'].includes(user.role)) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

// JWT dibaca hanya untuk memulihkan identitas tampilan saat offline.
// Token tetap divalidasi oleh backend setiap kali API dipanggil.
function readUserFromToken(token) {
  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return null;

    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      '='
    );
    const payload = JSON.parse(atob(padded));

    if (!payload?.id || !['customer', 'driver'].includes(payload.role)) {
      return null;
    }

    return {
      id: payload.id,
      email: payload.email || '',
      role: payload.role,
      nama: payload.nama || '',
    };
  } catch {
    return null;
  }
}

function saveUserCache(user) {
  if (!user?.id || !['customer', 'driver'].includes(user.role)) return;

  try {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
  } catch (error) {
    console.warn('Cache sesi tidak dapat disimpan:', error);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readCachedUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      // Tampilkan sesi tersimpan secepatnya agar halaman History bisa dibuka
      // tanpa menunggu server. Jika cache profil belum ada, gunakan klaim JWT.
      const localUser = readCachedUser() || readUserFromToken(token);

      if (localUser && !cancelled) {
        setUser(localUser);
        saveUserCache(localUser);
        setLoading(false);
      }

      try {
        const res = await api.get('/auth/me');
        const freshUser = res.data?.user;

        if (!cancelled && freshUser?.id) {
          setUser(freshUser);
          saveUserCache(freshUser);
          setLoading(false);
        }
      } catch (err) {
        const status = err.response?.status;

        // Hanya respons autentikasi yang jelas tidak valid yang mengakhiri sesi.
        // Gangguan jaringan/server tidak boleh dianggap sebagai logout.
        if (status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_CACHE_KEY);

          if (!cancelled) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        if (!cancelled) {
          setUser(localUser || null);
          setLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const applyAuthResponse = useCallback((data) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    saveUserCache(data.user);
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

  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      if (!prev) return prev;

      const next = { ...prev, ...patch };
      saveUserCache(next);
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_CACHE_KEY);
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