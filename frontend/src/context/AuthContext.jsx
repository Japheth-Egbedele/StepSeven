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

  // On mount — check if a valid session cookie exists by hitting /auth/me
  // No localStorage involved. Cookie is sent automatically by the browser.
  useEffect(() => {
    axios.get('/auth/me')
      .then(res => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    // Backend sets HTTP-only cookie on success — nothing to store locally
    const response = await axios.post('/auth/login', credentials);
    setUser(response.data);
    return response;
  };

  const register = async (userData) => {
    const response = await axios.post('/auth/register', userData);
    setUser(response.data);
    return response;
  };

  const logout = async () => {
    try {
      await axios.post('/auth/logout'); // tells backend to clear the cookie
    } catch {
      // Even if the request fails, clear local state
    } finally {
      setUser(null);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      updateUser,
      isAuthenticated: !!user
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};