import React, { useEffect, useState } from 'react';
import { getEvents, getDevices, EventRow, DeviceRow, EventsFilter } from '../services/api';

const DataPage: React.FC = () => {
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<EventsFilter>({ page: 1, limit: 20 });

  const load = async (f: EventsFilter) => {
    const res = await getEvents(f);
    setEvents(res.events); setTotal(res.total); setTotalPages(res.totalPages);
  };

  useEffect(() => { getDevices().then(setDevices); }, []);
  useEffect(() => { load(filter); }, [filter]);

  const update = (patch: Partial<EventsFilter>) =>
    setFilter((p) => ({ ...p, ...patch, page: patch.page ?? 1 }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Données</h2>

      <div className="bg-white rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <select
          className="border rounded px-3 py-2 text-sm"
          value={filter.deviceId ?? ''}
          onChange={(e) => update({ deviceId: e.target.value || undefined })}
        >
          <option value="">Tous les devices</option>
          {devices.map((d) => (
            <option key={d.id} value={d.deviceId}>{d.deviceId}</option>
          ))}
        </select>
        <select
          className="border rounded px-3 py-2 text-sm"
          value={filter.type ?? ''}
          onChange={(e) => update({ type: e.target.value || undefined })}
        >
          <option value="">Tous les types</option>
          <option value="Serial">Serial</option>
          <option value="MQTT">MQTT</option>
          <option value="Simulation">Simulation</option>
        </select>
        <input
          type="date"
          className="border rounded px-3 py-2 text-sm"
          value={filter.from ?? ''}
          onChange={(e) => update({ from: e.target.value || undefined })}
        />
        <input
          type="date"
          className="border rounded px-3 py-2 text-sm"
          value={filter.to ?? ''}
          onChange={(e) => update({ to: e.target.value || undefined })}
        />
        <input
          type="text"
          placeholder="Recherche…"
          className="border rounded px-3 py-2 text-sm"
          value={filter.search ?? ''}
          onChange={(e) => update({ search: e.target.value || undefined })}
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Device</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-t hover:bg-slate-50">
                <td className="px-4 py-2">{e.id}</td>
                <td className="px-4 py-2 font-mono">{e.device?.deviceId ?? '—'}</td>
                <td className="px-4 py-2">{e.device?.type ?? '—'}</td>
                <td className="px-4 py-2 font-mono truncate max-w-xs">{e.data}</td>
                <td className="px-4 py-2 text-slate-500">
                  {new Date(e.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-slate-400">Aucun résultat</td></tr>
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t text-sm">
          <span className="text-slate-600">
            {total} résultats — page {filter.page} / {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={(filter.page ?? 1) <= 1}
              onClick={() => update({ page: (filter.page ?? 1) - 1 })}
              className="px-3 py-1.5 rounded bg-white border hover:bg-slate-100 disabled:opacity-50"
            >Précédent</button>
            <button
              disabled={(filter.page ?? 1) >= totalPages}
              onClick={() => update({ page: (filter.page ?? 1) + 1 })}
              className="px-3 py-1.5 rounded bg-white border hover:bg-slate-100 disabled:opacity-50"
            >Suivant</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataPage;
