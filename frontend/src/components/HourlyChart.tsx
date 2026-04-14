import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

interface Props {
  data: Array<{ hour: string; count: number }>;
}

const HourlyChart: React.FC<Props> = ({ data }) => {
  const formatted = data.map((d) => ({
    ...d,
    label: d.hour.slice(11, 16),
  }));

  return (
    <div className="bg-white rounded-lg shadow p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">
        Événements par heure (24h)
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" fontSize={11} />
          <YAxis fontSize={11} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HourlyChart;
