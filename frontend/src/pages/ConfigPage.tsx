import React, { useEffect, useState } from 'react';
import { getConfig, toggleSimulation } from '../services/api';

const Field: React.FC<{ label: string; value: any }> = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b last:border-0 text-sm">
    <span className="text-slate-500">{label}</span>
    <span className="font-mono text-slate-800">{String(value)}</span>
  </div>
);

const ConfigPage: React.FC = () => {
  const [cfg, setCfg] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const load = () => getConfig().then(setCfg);
  useEffect(() => { load(); }, []);

  const onToggle = async () => {
    if (!cfg) return;
    setBusy(true);
    try {
      const res = await toggleSimulation(!cfg.simulation.enabled);
      setCfg({ ...cfg, simulation: { enabled: res.enabled } });
    } finally {
      setBusy(false);
    }
  };

  if (!cfg) return <p className="text-slate-500">Chargement…</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-2xl font-bold text-slate-800">Configuration</h2>

      <div className="bg-white rounded-lg shadow p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Port série</h3>
        <Field label="Port" value={cfg.serial.port} />
        <Field label="Baud rate" value={cfg.serial.baudRate} />
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">MQTT</h3>
        <Field label="Broker" value={cfg.mqtt.broker} />
        <Field label="Topic" value={cfg.mqtt.topic} />
        <Field label="Client ID" value={cfg.mqtt.clientId} />
        <Field label="Authentification" value={cfg.mqtt.hasAuth ? 'Oui' : 'Non'} />
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Base de données</h3>
        <Field label="Chemin" value={cfg.database.path} />
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Simulation</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">
              État : <span className={`font-semibold ${cfg.simulation.enabled ? 'text-emerald-600' : 'text-slate-500'}`}>
                {cfg.simulation.enabled ? 'ACTIVE' : 'Arrêtée'}
              </span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Génère des événements factices toutes les 30s.
            </p>
          </div>
          <button
            disabled={busy}
            onClick={onToggle}
            className={`px-4 py-2 rounded text-white text-sm font-medium transition ${
              cfg.simulation.enabled
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            } disabled:opacity-50`}
          >
            {cfg.simulation.enabled ? 'Arrêter' : 'Démarrer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigPage;
