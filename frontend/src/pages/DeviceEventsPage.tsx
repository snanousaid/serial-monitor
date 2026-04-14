import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDevice, getDeviceEvents } from '../services/api';

interface Event {
  id: number;
  data: string;
  createdAt: string;
}

interface PaginatedEvents {
  events: Event[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const DeviceEventsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [device, setDevice] = useState<any>(null);
  const [paginated, setPaginated] = useState<PaginatedEvents | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getDevice(+id).then(setDevice);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getDeviceEvents(+id, page, 50)
      .then(setPaginated)
      .finally(() => setLoading(false));
  }, [id, page]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </button>
        <div className="h-6 w-px bg-gray-600" />
        <div>
          <h1 className="text-lg font-bold">
            Events — Device{' '}
            <span className="font-mono text-blue-400">{device?.deviceId ?? `#${id}`}</span>
          </h1>
          {device && (
            <p className="text-xs text-gray-400">
              Type : {device.type} · Total : {device._count?.events ?? '…'} events
            </p>
          )}
        </div>
      </header>

      <main className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
          </div>
        ) : !paginated || paginated.events.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            Aucun événement enregistré pour cet appareil.
          </div>
        ) : (
          <>
            <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 mb-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">ID</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Data (HEX)</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date / Heure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {paginated.events.map((evt) => (
                    <tr key={evt.id} className="hover:bg-gray-750 transition-colors">
                      <td className="px-5 py-3 text-gray-400 font-mono text-sm">{evt.id}</td>
                      <td className="px-5 py-3 font-mono text-green-400 text-sm break-all max-w-md">
                        {evt.data}
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-sm whitespace-nowrap">
                        {formatDate(evt.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {paginated.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Page {paginated.page} / {paginated.totalPages} —{' '}
                  {paginated.total.toLocaleString()} events au total
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-40
                               disabled:cursor-not-allowed rounded-lg text-sm transition-colors"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(paginated.totalPages, p + 1))}
                    disabled={page === paginated.totalPages}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-40
                               disabled:cursor-not-allowed rounded-lg text-sm transition-colors"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default DeviceEventsPage;
