import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SerialPort } from 'serialport';
import { PrismaService } from '../prisma/prisma.service';
import { SerialGateway } from '../gateway/serial.gateway';

/**
 * Format JSON attendu depuis le port série (une ligne par trame) :
 *   {"deviceId":"ABC123","data":{"temperature":25.5,"humidity":60}}
 *
 * Chaque trame doit se terminer par '\n' (newline-delimited JSON).
 * Le champ "deviceId" est obligatoire.
 * Le champ "data" peut être n'importe quel objet JSON ou string.
 */

@Injectable()
export class SerialService implements OnModuleInit {
  private readonly logger = new Logger(SerialService.name);
  private port: SerialPort | null = null;
  private lineBuffer = '';

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: SerialGateway,
  ) {}

  onModuleInit() {
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
      // Accumule les caractères jusqu'au '\n' (fin de trame JSON)
      this.lineBuffer += chunk.toString('utf8');
      this.processLines();
    });

    this.port.on('error', (err) => {
      this.logger.error(`Erreur port série : ${err.message}`);
    });
  }

  /**
   * Découpe le buffer en lignes et traite chaque ligne JSON complète.
   * Une trame = une ligne terminée par '\n'.
   */
  private processLines() {
    const lines = this.lineBuffer.split('\n');

    // La dernière entrée est soit vide (si '\n' final) soit une trame incomplète
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
   * Parse la ligne JSON et sauvegarde en base.
   *
   * Logique EXCLUSIVEMENT côté backend :
   *  1. Parse le JSON reçu
   *  2. Extrait le deviceId
   *  3. Vérifie si le device existe déjà
   *  4. Crée le device si absent
   *  5. Sauvegarde l'event lié au device
   *  6. Émet via WebSocket vers le frontend
   */
  private async parseAndSave(rawLine: string) {
    // ── 1. Parse JSON ──
    let parsed: Record<string, any>;
    try {
      parsed = JSON.parse(rawLine);
    } catch {
      this.logger.warn(`Ligne ignorée (JSON invalide) : ${rawLine}`);
      return;
    }

    // ── 2. Extraction du deviceId (obligatoire) ──
    const deviceId = parsed.deviceId ?? parsed.device_id ?? parsed.id;
    if (!deviceId || typeof deviceId !== 'string') {
      this.logger.warn(`Champ "deviceId" manquant ou invalide : ${rawLine}`);
      return;
    }

    // ── 3. Payload data : tout sauf deviceId, sérialisé en JSON string ──
    const { deviceId: _, device_id: __, id: ___, ...rest } = parsed;
    const dataString = Object.keys(rest).length > 0
      ? JSON.stringify(rest)
      : rawLine;

    this.logger.debug(`JSON reçu — deviceId: ${deviceId}, data: ${dataString}`);

    // ── 4. Vérification & création du Device (logique EXCLUSIVEMENT backend) ──
    let device = await this.prisma.device.findUnique({
      where: { deviceId },
    });

    if (!device) {
      device = await this.prisma.device.create({
        data: { deviceId, type: 'Serial' },
      });
      this.logger.log(`Nouveau device créé : ${deviceId} (id=${device.id})`);
    }

    // ── 5. Sauvegarde de l'Event lié au Device ──
    const event = await this.prisma.event.create({
      data: {
        data: dataString,
        deviceId: device.id,
      },
    });

    this.logger.log(`Event #${event.id} sauvegardé pour device "${deviceId}"`);

    // ── 6. Émission WebSocket vers le frontend ──
    this.gateway.emitNewEvent({ event, device });
  }

  // ── Simulation : envoyer un JSON directement sans matériel ──
  simulateJson(payload: Record<string, any>) {
    const line = JSON.stringify(payload);
    this.parseAndSave(line).catch((e) =>
      this.logger.error(`Erreur simulation : ${e.message}`),
    );
  }
}
