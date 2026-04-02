// src/context/AuthContext.js
import React, { createContext, useContext, useState } from 'react';
import { setAuthToken, clearAuthToken, login as apiLogin } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
    const data = await apiLogin(username, password);
    console.log('Login response:', data); // debug
    setAuthToken(data.token);
    setUser(data.user);
    return true;
    } catch (e) {
      setError(e.message || 'Login failed. Check your credentials.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
