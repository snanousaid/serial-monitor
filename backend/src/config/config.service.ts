import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { SimulationService } from '../simulation/simulation.service';
import { SerialService } from '../serial/serial.service';
import { MqttService } from '../mqtt/mqtt.service';

export interface SerialConfig { port: string; baudRate: number; }
export interface MqttConfig {
  broker: string; topic: string; clientId: string;
  username?: string; password?: string;
}

const ENV_PATH = path.join(process.cwd(), '.env');

@Injectable()
export class AppConfigService {
  constructor(
    private readonly simulation: SimulationService,
    private readonly serial: SerialService,
    private readonly mqtt: MqttService,
  ) {}

  getConfig() {
    return {
      serial: {
        port:     process.env.SERIAL_PORT       || 'COM3',
        baudRate: Number(process.env.SERIAL_BAUD_RATE || 9600),
      },
      mqtt: {
        broker:   process.env.MQTT_BROKER       || 'mqtt://localhost:1883',
        topic:    process.env.MQTT_TOPIC        || 'devices/data',
        clientId: process.env.MQTT_CLIENT_ID    || '',
        username: process.env.MQTT_USERNAME     || '',
        hasAuth:  Boolean(process.env.MQTT_USERNAME),
      },
    };
  }

  async toggleSimulation(enabled: boolean) {
    if (enabled) this.simulation.start();
    else         this.simulation.stop();
    return { enabled: this.simulation.isRunning() };
  }

  async updateSerial(cfg: SerialConfig) {
    this.writeEnv({
      SERIAL_PORT: cfg.port,
      SERIAL_BAUD_RATE: String(cfg.baudRate),
    });
    process.env.SERIAL_PORT = cfg.port;
    process.env.SERIAL_BAUD_RATE = String(cfg.baudRate);
    await this.serial.restart();
    return { ok: true };
  }

  async updateMqtt(cfg: MqttConfig) {
    const updates: Record<string, string> = {
      MQTT_BROKER: cfg.broker,
      MQTT_TOPIC: cfg.topic,
      MQTT_CLIENT_ID: cfg.clientId,
    };
    if (cfg.username !== undefined) updates.MQTT_USERNAME = cfg.username;
    if (cfg.password) updates.MQTT_PASSWORD = cfg.password;
    this.writeEnv(updates);
    Object.entries(updates).forEach(([k, v]) => { process.env[k] = v; });
    await this.mqtt.restart();
    return { ok: true };
  }

  private escapeEnvValue(v: string) {
    return v.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '');
  }

  private writeEnv(updates: Record<string, string>) {
    let content = '';
    try { content = fs.readFileSync(ENV_PATH, 'utf8'); } catch {}
    const lines = content.split(/\r?\n/);
    const seen = new Set<string>();
    const out = lines.map((line) => {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=/);
      if (m && updates[m[1]] !== undefined) {
        seen.add(m[1]);
        return `${m[1]}="${this.escapeEnvValue(updates[m[1]])}"`;
      }
      return line;
    });
    for (const [k, v] of Object.entries(updates)) {
      if (!seen.has(k)) out.push(`${k}="${this.escapeEnvValue(v)}"`);
    }
    fs.writeFileSync(ENV_PATH, out.join('\n'));
  }
}
