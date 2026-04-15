import React, { useEffect, useState } from 'react';
import StatCard from '../components/StatCard';
import HourlyChart from '../components/HourlyChart';
import {
  getSummary, getHourly, getTopDevices, getRecentEvents, EventRow,
} from '../services/api';
import { connectSocket, onNewEvent, offNewEvent } from '../services/socket';

const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [hourly, setHourly] = useState<Array<{ hour: string; count: number }>>([]);
  const [top, setTop] = useState<any[]>([]);
  const [recent, setRecent] = useState<EventRow[]>([]);

  const refresh = async () => {
    const [s, h, t, r] = await Promise.all([
      getSummary(), getHourly(), getTopDevices(), getRecentEvents(5),
    ]);
    setSummary(s); setHourly(h); setTop(t); setRecent(r);
  };

  useEffect(() => {
    refresh();
    connectSocket();
    onNewEvent(() => refresh());
    return () => offNewEvent();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Devices" value={summary?.devicesCount ?? '—'} icon="📟" accent="bg-blue-500" />
        <StatCard label="Événements" value={summary?.eventsCount ?? '—'} icon="📨" accent="bg-emerald-500" />
        <StatCard label="Aujourd'hui" value={summary?.todayCount ?? '—'} icon="📅" accent="bg-amber-500" />
        <StatCard
          label="Dernier événement"
          value={summary?.lastEvent ? new Date(summary.lastEvent.createdAt).toLocaleTimeString() : '—'}
          icon="⏱️"
          accent="bg-purple-500"
        />
      </div>

      <HourlyChart data={hourly} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Top 5 devices</h3>
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr><th className="py-2">Device ID</th><th>Type</th><th className="text-right">Événements</th></tr>
            </thead>
            <tbody>
              {top.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="py-2 font-mono">{d.deviceId}</td>
                  <td>{d.type}</td>
                  <td className="text-right font-semibold">{d.eventCount}</td>
                </tr>
              ))}
              {top.length === 0 && (
                <tr><td colSpan={3} className="text-center py-4 text-slate-400">Aucune donnée</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">5 derniers événements</h3>
          <ul className="space-y-2 text-sm">
            {recent.map((e) => (
              <li key={e.id} className="border-b pb-2 last:border-0">
                <div className="flex justify-between text-slate-500 text-xs">
                  <span className="font-mono">{e.device?.deviceId ?? '—'}</span>
                  <span>{new Date(e.createdAt).toLocaleTimeString()}</span>
                </div>
                <div className="font-mono text-slate-800 truncate">{e.data}</div>
              </li>
            ))}
            {recent.length === 0 && (
              <li className="text-center text-slate-400 py-4">Aucun événement</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
