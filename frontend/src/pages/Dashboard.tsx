import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDevices, getRecentEvents } from '../services/api';
import { connectSocket, onNewEvent } from '../services/socket';
import { disconnectSocket } from '../services/socket';

interface Device {
  id: number;
  deviceId: string;
  type: string;
  _count: { events: number };
}

interface RecentEvent {
  id: number;
  data: string;
  createdAt: string;
  device: { deviceId: string; type: string };
}

// ── Onglets de navigation interne ──
type Tab = 'dashboard' | 'data';

const Dashboard: React.FC = () => {
  const { username, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [devices, setDevices] = useState<Device[]>([]);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [devs, evts] = await Promise.all([
        getDevices(),
        getRecentEvents(50),
      ]);
      setDevices(devs);
      setRecentEvents(evts);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const socket = connectSocket();
    setWsConnected(socket.connected);
    socket.on('connect', () => setWsConnected(true));
    socket.on('disconnect', () => setWsConnected(false));

    onNewEvent(({ event, device }) => {
      setRecentEvents((prev) => [
        { ...event, device: { deviceId: device.deviceId, type: device.type } },
        ...prev.slice(0, 49),
      ]);
      setDevices((prev) => {
        const exists = prev.some((d) => d.id === device.id);
        if (!exists) return [...prev, { ...device, _count: { events: 1 } }];
        return prev.map((d) =>
          d.id === device.id
            ? { ...d, _count: { events: d._count.events + 1 } }
            : d,
        );
      });
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('new-event');
    };
  }, [fetchData]);

  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate('/login');
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* ── Header ── */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight">Serial Monitor</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Badge WS */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
            <span className={wsConnected ? 'text-green-400' : 'text-red-400'}>
              {wsConnected ? 'WS connecté' : 'WS déconnecté'}
            </span>
          </div>
          <span className="text-gray-500 text-sm hidden sm:block">
            {username}
          </span>
          <button
            onClick={handleLogout}
            className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </header>

      {/* ── Barre de navigation par onglets ── */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6 flex gap-1 shrink-0">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'dashboard'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'data'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          Données
          {recentEvents.length > 0 && (
            <span className="bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
              {recentEvents.length}
            </span>
          )}
        </button>
      </nav>

      {/* ── Contenu ── */}
      <main className="flex-1 p-6 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
          </div>
        ) : (
          <>
            {/* ════ ONGLET DASHBOARD ════ */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">

                {/* Cartes statistiques */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard
                    label="Appareils connectés"
                    value={devices.length}
                    color="blue"
                    icon={
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                    }
                  />
                  <StatCard
                    label="Total événements"
                    value={devices.reduce((s, d) => s + d._count.events, 0)}
                    color="green"
                    icon={
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 7h16M4 12h16M4 17h10" />
                    }
                  />
                  <StatCard
                    label="Statut WebSocket"
                    value={wsConnected ? 'En ligne' : 'Hors ligne'}
                    color={wsConnected ? 'green' : 'red'}
                    icon={
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                    }
                  />
                </div>

                {/* Tableau des appareils */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-semibold text-gray-200">Appareils détectés</h2>
                    <button
                      onClick={fetchData}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Rafraîchir
                    </button>
                  </div>

                  <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                    {devices.length === 0 ? (
                      <div className="text-center py-14 text-gray-600 text-sm">
                        En attente de données...
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-800">
                            <Th>ID</Th>
                            <Th>Device ID</Th>
                            <Th>Type</Th>
                            <Th>Nb Events</Th>
                            <Th>Actions</Th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {devices.map((device) => (
                            <tr key={device.id} className="hover:bg-gray-800/50 transition-colors">
                              <td className="px-5 py-3.5 text-gray-500 font-mono text-sm">{device.id}</td>
                              <td className="px-5 py-3.5">
                                <span className="font-mono text-blue-400 font-semibold bg-blue-950 px-2 py-1 rounded text-sm">
                                  {device.deviceId}
                                </span>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                  device.type === 'MQTT'       ? 'bg-purple-950 text-purple-400' :
                                  device.type === 'Simulation' ? 'bg-yellow-950 text-yellow-400' :
                                                                  'bg-green-950 text-green-400'
                                }`}>
                                  {device.type}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-gray-300 font-semibold text-sm">
                                {device._count.events.toLocaleString()}
                              </td>
                              <td className="px-5 py-3.5">
                                <button
                                  onClick={() => navigate(`/devices/${device.id}/events`)}
                                  className="text-xs bg-blue-700 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  Voir Events
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </section>
              </div>
            )}

            {/* ════ ONGLET DONNÉES ════ */}
            {activeTab === 'data' && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold text-gray-200">
                    Données reçues
                    <span className="ml-2 text-xs text-gray-500 font-normal">temps réel</span>
                  </h2>
                  <span className="text-xs text-gray-600">
                    {recentEvents.length} entrées affichées
                  </span>
                </div>

                <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                  {recentEvents.length === 0 ? (
                    <div className="text-center py-14 text-gray-600 text-sm">
                      En attente de données...
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-800">
                            <Th>#</Th>
                            <Th>Device ID</Th>
                            <Th>Data</Th>
                            <Th>Date / Heure</Th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {recentEvents.map((evt, i) => (
                            <tr
                              key={evt.id}
                              className={`transition-colors hover:bg-gray-800/50 ${
                                i === 0 ? 'bg-blue-950/20' : ''
                              }`}
                            >
                              <td className="px-5 py-3 text-gray-600 font-mono text-xs">{evt.id}</td>
                              <td className="px-5 py-3">
                                <span className="font-mono text-blue-400 text-sm font-semibold bg-blue-950 px-2 py-0.5 rounded">
                                  {evt.device.deviceId}
                                </span>
                              </td>
                              <td className="px-5 py-3 font-mono text-green-400 text-sm max-w-sm truncate">
                                <DataCell raw={evt.data} />
                              </td>
                              <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">
                                {formatDate(evt.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
};

// ── Composants utilitaires ──

const Th: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
    {children}
  </th>
);

const StatCard: React.FC<{
  label: string;
  value: string | number;
  color: 'blue' | 'green' | 'red';
  icon: React.ReactNode;
}> = ({ label, value, color, icon }) => {
  const colors = {
    blue: 'bg-blue-950 text-blue-400 border-blue-900',
    green: 'bg-green-950 text-green-400 border-green-900',
    red: 'bg-red-950 text-red-400 border-red-900',
  };
  return (
    <div className={`rounded-xl border p-5 flex items-center gap-4 ${colors[color]}`}>
      <div className="shrink-0">
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {icon}
        </svg>
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
};

/** Affiche le JSON formaté si possible, sinon brut */
const DataCell: React.FC<{ raw: string }> = ({ raw }) => {
  try {
    const obj = JSON.parse(raw);
    return (
      <span className="text-green-400">
        {Object.entries(obj)
          .map(([k, v]) => `${k}: ${v}`)
          .join(' | ')}
      </span>
    );
  } catch {
    return <span>{raw}</span>;
  }
};

export default Dashboard;
