import React from 'react';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { username, logout } = useAuth();
  return (
    <header className="h-14 bg-slate-900 text-white flex items-center justify-between px-6 shadow">
      <div className="flex items-center gap-3">
        <span className="text-xl">📡</span>
        <h1 className="font-semibold tracking-wide">Serial Monitor</h1>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span className="opacity-80">👤 {username ?? 'admin'}</span>
        <button
          onClick={logout}
          className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 transition"
        >
          Déconnexion
        </button>
      </div>
    </header>
  );
};

export default Navbar;
