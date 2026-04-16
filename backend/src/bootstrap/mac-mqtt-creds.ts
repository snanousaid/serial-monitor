import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const ENV_PATH = path.join(process.cwd(), '.env');

function getEthMac(): string | null {
  const nets = os.networkInterfaces();
  const names = Object.keys(nets);
  const ordered = [
    ...names.filter((n) => n === 'eth0'),
    ...names.filter((n) => n.startsWith('eth') && n !== 'eth0'),
    ...names.filter((n) => !n.startsWith('eth')),
  ];
  for (const name of ordered) {
    for (const addr of nets[name] ?? []) {
      if (!addr.internal && addr.mac && addr.mac !== '00:00:00:00:00:00') {
        return addr.mac.replace(/:/g, '');
      }
    }
  }
  return null;
}

function escapeEnvValue(v: string) {
  return v.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '');
}

function writeEnv(updates: Record<string, string>) {
  let content = '';
  try { content = fs.readFileSync(ENV_PATH, 'utf8'); } catch {}
  const lines = content.split(/\r?\n/);
  const seen = new Set<string>();
  const out = lines.map((line) => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=/);
    if (m && updates[m[1]] !== undefined) {
      seen.add(m[1]);
      return `${m[1]}="${escapeEnvValue(updates[m[1]])}"`;
    }
    return line;
  });
  for (const [k, v] of Object.entries(updates)) {
    if (!seen.has(k)) out.push(`${k}="${escapeEnvValue(v)}"`);
  }
  fs.writeFileSync(ENV_PATH, out.join('\n'));
}

function parseEnv(content: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

export function ensureMqttCredsFromMac() {
  const inDist =
    __dirname.includes(`${path.sep}dist${path.sep}`) ||
    __dirname.endsWith(`${path.sep}dist`) ||
    __dirname.includes(`${path.sep}dist${path.sep}bootstrap`);
  if (!inDist) return;

  let content = '';
  try { content = fs.readFileSync(ENV_PATH, 'utf8'); } catch { return; }
  const env = parseEnv(content);

  const needUser = !env.MQTT_USERNAME;
  const needPass = !env.MQTT_PASSWORD;
  const needClient = !env.MQTT_CLIENT_ID;
  if (!needUser && !needPass && !needClient) return;

  const mac = getEthMac();
  if (!mac) {
    console.warn('[bootstrap] Aucune interface eth avec MAC détectée, skip');
    return;
  }

  const updates: Record<string, string> = {};
  if (needUser) updates.MQTT_USERNAME = mac;
  if (needPass) updates.MQTT_PASSWORD = mac;
  if (needClient) updates.MQTT_CLIENT_ID = mac;

  writeEnv(updates);
  for (const [k, v] of Object.entries(updates)) process.env[k] = v;
  console.log(`[bootstrap] MQTT creds initialisés depuis MAC eth: ${mac}`);
}
