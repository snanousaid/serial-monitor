import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SerialPort } from 'serialport';
import { Device } from '../entities/device.entity';
import { Event } from '../entities/event.entity';
import { SerialGateway } from '../gateway/serial.gateway';

/**
 * Format JSON attendu depuis le port série (une ligne par trame) :
 *   {"deviceId":"ABC123","temperature":25.5,"humidity":60}
 *
 * Chaque trame doit se terminer par '\n' (newline-delimited JSON).
 */

@Injectable()
export class SerialService implements OnModuleInit {
  private readonly logger = new Logger(SerialService.name);
  private port: SerialPort | null = null;
  private lineBuffer = '';

  constructor(
    @InjectRepository(Device) private readonly deviceRepo: Repository<Device>,
    @InjectRepository(Event)  private readonly eventRepo:  Repository<Event>,
    private readonly gateway: SerialGateway,
  ) {}

  onModuleInit() {
    this.openPort();
  }

  async restart() {
    await new Promise<void>((resolve) => {
      if (!this.port) return resolve();
      try { this.port.removeAllListeners(); } catch {}
      this.port.close(() => resolve());
    });
    this.port = null;
    this.lineBuffer = '';
    this.openPort();
  }

  private openPort() {
    const portPath = process.env.SERIAL_PORT || 'COM3';
    const baudRate = parseInt(process.env.SERIAL_BAUD_RATE || '9600', 10);

    this.logger.log(`Ouverture du port série : ${portPath} @ ${baudRate} bauds`);

    this.port = new SerialPort({ path: portPath, baudRate, autoOpen: false });

    this.port.open((err) => {
      if (err) {
        this.logger.error(`Impossible d'ouvrir le port ${portPath} : ${err.message}`);
        this.logger.warn('Vérifiez SERIAL_PORT dans .env — port non disponible.');
        return;
      }
      this.logger.log(`Port ${portPath} ouvert avec succès.`);
    });

    this.port.on('data', (chunk: Buffer) => {
      this.lineBuffer += chunk.toString('utf8');
      this.processLines();
    });

    this.port.on('error', (err) => {
      this.logger.error(`Erreur port série : ${err.message}`);
    });
  }

  private processLines() {
    const lines = this.lineBuffer.split('\n');
    this.lineBuffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length === 0) continue;

      this.parseAndSave(trimmed).catch((e) =>
        this.logger.error(`Erreur sauvegarde : ${e.message}`),
      );
    }
  }

  /**
   * Logique EXCLUSIVEMENT côté backend :
   *  1. Parse le JSON reçu
   *  2. Extrait le deviceId
   *  3. Vérifie si le device existe déjà
   *  4. Crée le device si absent
   *  5. Sauvegarde l'event lié au device
   *  6. Émet via WebSocket vers le frontend
   */
  private async parseAndSave(rawLine: string) {
    let parsed: Record<string, any>;
    try {
      parsed = JSON.parse(rawLine);
    } catch {
      this.logger.warn(`Ligne ignorée (JSON invalide) : ${rawLine}`);
      return;
    }

    const deviceId = parsed.deviceId ?? parsed.device_id ?? parsed.id;
    if (!deviceId || typeof deviceId !== 'string') {
      this.logger.warn(`Champ "deviceId" manquant ou invalide : ${rawLine}`);
      return;
    }

    const { deviceId: _a, device_id: _b, id: _c, ...rest } = parsed;
    const dataString = Object.keys(rest).length > 0
      ? JSON.stringify(rest)
      : rawLine;

    // ── Vérification & création du Device (TypeORM) ──
    let device = await this.deviceRepo.findOne({ where: { deviceId } });

    if (!device) {
      device = this.deviceRepo.create({ deviceId, type: 'Serial' });
      device = await this.deviceRepo.save(device);
      this.logger.log(`Nouveau device créé : ${deviceId} (id=${device.id})`);
    }

    // ── Sauvegarde de l'Event ──
    const event = await this.eventRepo.save(
      this.eventRepo.create({ data: dataString, deviceId: device.id }),
    );

    this.logger.log(`Event #${event.id} sauvegardé pour device "${deviceId}"`);

    // ── Émission WebSocket ──
    this.gateway.emitNewEvent({ event, device });
  }

  simulateJson(payload: Record<string, any>) {
    this.parseAndSave(JSON.stringify(payload)).catch((e) =>
      this.logger.error(`Erreur simulation : ${e.message}`),
    );
  }
}
