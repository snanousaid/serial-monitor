import React, { useEffect, useState } from 'react';
import {
  getConfig, updateSerialConfig, updateMqttConfig,
  SerialConfig, MqttConfig,
} from '../services/api';
import ModemPanel from '../components/ModemPanel';

const ConfigPage: React.FC = () => {
  const [serial, setSerial] = useState<SerialConfig | null>(null);
  const [mqtt, setMqtt] = useState<MqttConfig | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    const cfg = await getConfig();
    setSerial(cfg.serial);
    setMqtt({ ...cfg.mqtt, username: cfg.mqtt.username ?? '', password: '' });
  };
  useEffect(() => { load(); }, []);

  const saveSerial = async () => {
    if (!serial) return;
    setBusy(true); setMsg(null);
    try {
      await updateSerialConfig(serial);
      setMsg('Configuration série mise à jour');
    } catch (e: any) {
      setMsg(`Erreur : ${e?.response?.data?.message ?? e.message}`);
    } finally { setBusy(false); }
  };

  const saveMqtt = async () => {
    if (!mqtt) return;
    setBusy(true); setMsg(null);
    try {
      await updateMqttConfig(mqtt);
      setMsg('Configuration MQTT mise à jour');
    } catch (e: any) {
      setMsg(`Erreur : ${e?.response?.data?.message ?? e.message}`);
    } finally { setBusy(false); }
  };

  if (!serial || !mqtt) return <p className="text-slate-500">Chargement…</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-2xl font-bold text-slate-800">Configuration</h2>

      <div className="bg-white rounded-lg shadow p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Port série</h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="block text-slate-500 text-xs mb-1">Port</span>
            <input
              className="w-full border rounded px-3 py-2 font-mono"
              value={serial.port}
              onChange={(e) => setSerial({ ...serial, port: e.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="block text-slate-500 text-xs mb-1">Baud rate</span>
            <input
              type="number"
              className="w-full border rounded px-3 py-2 font-mono"
              value={serial.baudRate}
              onChange={(e) => setSerial({ ...serial, baudRate: Number(e.target.value) })}
            />
          </label>
        </div>
        <button
          disabled={busy}
          onClick={saveSerial}
          className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
        >Enregistrer & reconnecter</button>
      </div>

      <div className="bg-white rounded-lg shadow p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">MQTT</h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm col-span-2">
            <span className="block text-slate-500 text-xs mb-1">Broker</span>
            <input
              className="w-full border rounded px-3 py-2 font-mono"
              value={mqtt.broker}
              onChange={(e) => setMqtt({ ...mqtt, broker: e.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="block text-slate-500 text-xs mb-1">Topic</span>
            <input
              className="w-full border rounded px-3 py-2 font-mono"
              value={mqtt.topic}
              onChange={(e) => setMqtt({ ...mqtt, topic: e.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="block text-slate-500 text-xs mb-1">Client ID</span>
            <input
              className="w-full border rounded px-3 py-2 font-mono"
              value={mqtt.clientId}
              onChange={(e) => setMqtt({ ...mqtt, clientId: e.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="block text-slate-500 text-xs mb-1">Username</span>
            <input
              className="w-full border rounded px-3 py-2"
              value={mqtt.username ?? ''}
              onChange={(e) => setMqtt({ ...mqtt, username: e.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="block text-slate-500 text-xs mb-1">Password</span>
            <input
              type="password"
              className="w-full border rounded px-3 py-2"
              placeholder={mqtt.hasAuth ? '••• (inchangé si vide)' : ''}
              value={mqtt.password ?? ''}
              onChange={(e) => setMqtt({ ...mqtt, password: e.target.value })}
            />
          </label>
        </div>
        <button
          disabled={busy}
          onClick={saveMqtt}
          className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
        >Enregistrer & reconnecter</button>
      </div>

      {msg && (
        <div className="text-sm text-slate-700 bg-slate-100 rounded px-4 py-2">{msg}</div>
      )}

      <ModemPanel />
    </div>
  );
};

export default ConfigPage;
