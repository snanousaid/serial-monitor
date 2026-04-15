import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { SerialPort } from 'serialport';
import * as os from 'os';

const execP = promisify(exec);

const MODEM_PORT = process.env.MODEM_PORT || '/dev/ttyUSB3';
const MODEM_BAUD = parseInt(process.env.MODEM_BAUD || '115200', 10);

export interface NmConnection {
  name: string;
  uuid: string;
  type: string;
  device: string;
}

@Injectable()
export class ModemService {
  private readonly logger = new Logger(ModemService.name);

  isLinux(): boolean {
    return os.platform() === 'linux';
  }

  private ensureLinux() {
    if (!this.isLinux()) {
      throw new BadRequestException('Cette fonctionnalité requiert Linux');
    }
  }

  async listConnections(): Promise<NmConnection[]> {
    this.ensureLinux();
    const { stdout } = await execP('sudo nmcli -t -f NAME,UUID,TYPE,DEVICE connection show');
    return stdout
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [name, uuid, type, device] = line.split(':');
        return { name, uuid, type, device };
      });
  }

  async sendAT(cmd: string, timeoutMs = 3000): Promise<string> {
    this.ensureLinux();
    return new Promise((resolve, reject) => {
      const port = new SerialPort(
        { path: MODEM_PORT, baudRate: MODEM_BAUD, autoOpen: false },
      );
      let buffer = '';
      const cleanup = () => {
        try { port.removeAllListeners(); port.close(() => {}); } catch {}
      };
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error(`Timeout sur commande AT: ${cmd}`));
      }, timeoutMs);

      port.open((err) => {
        if (err) { clearTimeout(timer); return reject(err); }
        port.on('data', (chunk: Buffer) => {
          buffer += chunk.toString('utf8');
          if (/\r\n(OK|ERROR)\r\n/.test(buffer) || /\+CME ERROR/.test(buffer)) {
            clearTimeout(timer);
            cleanup();
            resolve(buffer.trim());
          }
        });
        port.write(`${cmd}\r`, (werr) => {
          if (werr) { clearTimeout(timer); cleanup(); reject(werr); }
        });
      });
    });
  }

  private extract(response: string, prefix: string): string | null {
    const re = new RegExp(`${prefix.replace(/[+?]/g, '\\$&')}:?\\s*([^\\r\\n]+)`);
    const m = response.match(re);
    return m ? m[1].trim() : null;
  }

  async status() {
    this.ensureLinux();
    const result: any = { linux: true, port: MODEM_PORT, baudRate: MODEM_BAUD };
    try {
      const cpin = await this.sendAT('AT+CPIN?');
      result.cpin = this.extract(cpin, '+CPIN') ?? cpin;
    } catch (e: any) { result.cpinError = e.message; }
    try {
      const iccid = await this.sendAT('AT+ICCID');
      result.iccid = this.extract(iccid, '+ICCID') ?? this.extract(iccid, 'ICCID') ?? null;
    } catch (e: any) { result.iccidError = e.message; }
    try {
      const cimi = await this.sendAT('AT+CIMI');
      const line = cimi.split(/\r?\n/).map((s) => s.trim()).find((s) => /^\d{5,}$/.test(s));
      result.imsi = line ?? null;
    } catch (e: any) { result.imsiError = e.message; }
    return result;
  }

  async unlockPin(pin: string) {
    this.ensureLinux();
    if (!/^\d{4,8}$/.test(pin)) {
      throw new BadRequestException('PIN invalide (4 à 8 chiffres)');
    }
    const res = await this.sendAT(`AT+CLCK="SC",0,"${pin}"`, 5000);
    return { ok: /\r\nOK\r\n/.test(res), response: res };
  }

  async restartModem() {
    this.ensureLinux();
    const res = await this.sendAT('AT+CFUN=1,1', 5000).catch((e) => e.message);
    return { ok: true, response: res };
  }

  async restartPppd() {
    this.ensureLinux();
    const { stdout, stderr } = await execP('sudo systemctl restart quectel-pppd.service');
    return { ok: true, stdout, stderr };
  }
}
