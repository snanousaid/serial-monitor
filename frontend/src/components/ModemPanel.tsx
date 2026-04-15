import React, { useEffect, useState } from 'react';
import {
  getModemPlatform, getModemConnections, getModemStatus,
  unlockSimPin, restartModem, restartPppd,
  NmConnection,
} from '../services/api';

const ModemPanel: React.FC = () => {
  const [linux, setLinux] = useState<boolean | null>(null);
  const [conns, setConns] = useState<NmConnection[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    getModemPlatform().then((p) => setLinux(p.linux)).catch(() => setLinux(false));
  }, []);

  const loadAll = async () => {
    setBusy(true); setMsg(null);
    try {
      const [c, s] = await Promise.all([getModemConnections(), getModemStatus()]);
      setConns(c); setStatus(s);
    } catch (e: any) {
      setMsg(e?.response?.data?.message ?? e.message);
    } finally { setBusy(false); }
  };

  const run = async (fn: () => Promise<any>, label: string) => {
    setBusy(true); setMsg(null);
    try {
      const res = await fn();
      setMsg(`${label} : ${JSON.stringify(res)}`);
    } catch (e: any) {
      setMsg(`${label} erreur : ${e?.response?.data?.message ?? e.message}`);
    } finally { setBusy(false); }
  };

  if (linux === null) return <p className="text-slate-500">Détection plateforme…</p>;

  if (!linux) {
    return (
      <div className="bg-white rounded-lg shadow p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Modem / SIM</h3>
        <p className="text-sm text-slate-500">
          Disponible uniquement sur Linux (ARM32 / cible de production).
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Modem / SIM (Linux)</h3>
        <button
          disabled={busy}
          onClick={loadAll}
          className="px-3 py-1.5 rounded bg-slate-700 text-white text-sm hover:bg-slate-800 disabled:opacity-50"
        >
          Rafraîchir
        </button>
      </div>

      {conns.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Connexions NetworkManager</p>
          <table className="w-full text-xs">
            <thead className="text-slate-500 text-left">
              <tr><th className="py-1">Nom</th><th>Type</th><th>Device</th></tr>
            </thead>
            <tbody>
              {conns.map((c) => (
                <tr key={c.uuid} className="border-t">
                  <td className="py-1 font-mono">{c.name}</td>
                  <td>{c.type}</td>
                  <td className="font-mono">{c.device || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {status && (
        <div className="text-sm space-y-1">
          <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">État SIM</p>
          <div className="flex justify-between"><span className="text-slate-500">Port</span><span className="font-mono">{status.port}@{status.baudRate}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">CPIN</span><span className="font-mono">{status.cpin ?? status.cpinError ?? '—'}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">ICCID</span><span className="font-mono">{status.iccid ?? status.iccidError ?? '—'}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">IMSI</span><span className="font-mono">{status.imsi ?? status.imsiError ?? '—'}</span></div>
        </div>
      )}

      <div className="border-t pt-4 space-y-2">
        <p className="text-xs uppercase tracking-wider text-slate-500">Déverrouiller PIN</p>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            placeholder="PIN (4-8 chiffres)"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="border rounded px-3 py-2 text-sm flex-1"
          />
          <button
            disabled={busy || !pin}
            onClick={() => run(() => unlockSimPin(pin), 'Unlock PIN')}
            className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
          >Envoyer</button>
        </div>
      </div>

      <div className="border-t pt-4 flex flex-wrap gap-2">
        <button
          disabled={busy}
          onClick={() => run(restartModem, 'Restart modem (AT+CFUN=1,1)')}
          className="px-4 py-2 rounded bg-amber-600 text-white text-sm hover:bg-amber-700 disabled:opacity-50"
        >Restart modem</button>
        <button
          disabled={busy}
          onClick={() => run(restartPppd, 'Restart pppd')}
          className="px-4 py-2 rounded bg-amber-600 text-white text-sm hover:bg-amber-700 disabled:opacity-50"
        >Restart quectel-pppd</button>
      </div>

      {msg && (
        <pre className="text-xs bg-slate-100 p-3 rounded whitespace-pre-wrap break-all">{msg}</pre>
      )}
    </div>
  );
};

export default ModemPanel;
