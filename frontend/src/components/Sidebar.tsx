import React from 'react';
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/data', label: 'Données', icon: '🗂️' },
  { to: '/config', label: 'Config', icon: '⚙️' },
];

const Sidebar: React.FC = () => (
  <aside className="w-56 bg-slate-800 text-slate-100 flex flex-col py-6">
    <nav className="flex flex-col gap-1 px-3">
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded transition ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-700 text-slate-300'
            }`
          }
        >
          <span>{l.icon}</span>
          <span className="text-sm font-medium">{l.label}</span>
        </NavLink>
      ))}
    </nav>
    <div className="mt-auto px-4 text-xs text-slate-500">
      v1.0.0
    </div>
  </aside>
);

export default Sidebar;
