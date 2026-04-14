import React, { createContext, useContext, useState, useCallback } from 'react';
import { login as apiLogin } from '../services/api';
import { disconnectSocket } from '../services/socket';

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('access_token'),
  );
  const [username, setUsername] = useState<string | null>(
    () => localStorage.getItem('username'),
  );

  const login = useCallback(async (user: string, password: string) => {
    const data = await apiLogin(user, password);
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('username', data.username);
    setToken(data.access_token);
    setUsername(data.username);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('username');
    setToken(null);
    setUsername(null);
    disconnectSocket();
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated: !!token, username, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
};
