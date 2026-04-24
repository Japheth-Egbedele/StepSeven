import { createContext, useState, useEffect, useContext } from 'react';
import axios from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/auth/me')
      .then((res) => {
        const profile = res?.data || null;
        setUser(profile);
      })   // axios interceptor returns { success, data }
      .catch((err) => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (credentials) => {
    const response = await axios.post('/auth/login', credentials);
    if (response?.token) {
      try { localStorage.setItem('stepseven_token', response.token); } catch {}
    }
    setUser(response.user);             // login returns { success, token, user }
    return response;
  };

  const register = async (userData) => {
    const response = await axios.post('/auth/register', userData);
    if (response?.token) {
      try { localStorage.setItem('stepseven_token', response.token); } catch {}
    }
    setUser(response.user);
    return response;
  };

  const logout = async () => {
    try {
      await axios.post('/auth/logout');
    } catch {
      // clear local state regardless
    } finally {
      try { localStorage.removeItem('stepseven_token'); } catch {}
      setUser(null);
    }
  };

  // Called by Settings after profile/currency updates
  const refreshUser = async () => {
    try {
      const res = await axios.get('/auth/me');
      setUser(res?.data || null);
    } catch {
      // silently fail — user stays as-is
    }
  };

  const updateUser = (updatedUser) => setUser(updatedUser);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      updateUser,
      isAuthenticated: !!user
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};