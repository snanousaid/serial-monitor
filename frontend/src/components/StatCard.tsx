import React from 'react';

interface Props {
  label: string;
  value: string | number;
  icon?: string;
  accent?: string;
}

const StatCard: React.FC<Props> = ({ label, value, icon, accent = 'bg-blue-500' }) => (
  <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
    {icon && (
      <div className={`w-12 h-12 flex items-center justify-center rounded-lg text-white text-2xl ${accent}`}>
        {icon}
      </div>
    )}
    <div>
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-800">{value}</p>
    </div>
  </div>
);

export default StatCard;
