import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { PrismaService } from '../prisma/prisma.service';
import { SerialGateway } from '../gateway/serial.gateway';

/**
 * Format JSON attendu sur le topic MQTT :
 *   {"deviceId":"ABC123","temperature":25.5,"humidity":60}
 *
 * Le champ "deviceId" est obligatoire.
 * Le reste des champs est sauvegardé dans Event.data (JSON stringifié).
 */

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client: mqtt.MqttClient | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: SerialGateway,
  ) {}

  onModuleInit() {
    this.connect();
  }

  onModuleDestroy() {
    this.client?.end();
  }

  private connect() {
    const brokerUrl = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
    const topic    = process.env.MQTT_TOPIC    || 'devices/data';
    const clientId = process.env.MQTT_CLIENT_ID || 'serial-monitor-backend';
    const username = process.env.MQTT_USERNAME  || undefined;
    const password = process.env.MQTT_PASSWORD  || undefined;

    this.logger.log(`Connexion au broker MQTT : ${brokerUrl}`);

    this.client = mqtt.connect(brokerUrl, {
      clientId,
      username,
      password,
      reconnectPeriod: 5000,   // reconnexion auto toutes les 5s
      connectTimeout: 10000,
    });

    this.client.on('connect', () => {
      this.logger.log(`Connecté au broker MQTT. Abonnement au topic : "${topic}"`);
      this.client!.subscribe(topic, { qos: 1 }, (err) => {
        if (err) this.logger.error(`Erreur abonnement topic "${topic}" : ${err.message}`);
      });
    });

    this.client.on('message', (receivedTopic: string, payload: Buffer) => {
      this.logger.debug(`Message reçu sur "${receivedTopic}" : ${payload.toString()}`);
      this.parseAndSave(receivedTopic, payload.toString()).catch((e) =>
        this.logger.error(`Erreur sauvegarde MQTT : ${e.message}`),
      );
    });

    this.client.on('reconnect', () => {
      this.logger.warn('Reconnexion au broker MQTT...');
    });

    this.client.on('error', (err) => {
      this.logger.error(`Erreur MQTT : ${err.message}`);
    });

    this.client.on('offline', () => {
      this.logger.warn('Client MQTT hors-ligne.');
    });
  }

  /**
   * Parse le payload JSON et sauvegarde en base.
   *
   * Logique EXCLUSIVEMENT côté backend :
   *  1. Parse le JSON reçu
   *  2. Extrait le deviceId
   *  3. Vérifie si le device existe déjà
   *  4. Crée le device si absent
   *  5. Sauvegarde l'event lié au device
   *  6. Émet via WebSocket vers le frontend
   */
  private async parseAndSave(topic: string, raw: string) {
    // ── 1. Parse JSON ──
    let parsed: Record<string, any>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      this.logger.warn(`Payload ignoré (JSON invalide) sur "${topic}" : ${raw}`);
      return;
    }

    // ── 2. Extraction du deviceId (obligatoire) ──
    const deviceId = parsed.deviceId ?? parsed.device_id ?? parsed.id;
    if (!deviceId || typeof deviceId !== 'string') {
      this.logger.warn(`Champ "deviceId" manquant dans le payload MQTT : ${raw}`);
      return;
    }

    // ── 3. Payload data : tout sauf les champs d'identification ──
    const { deviceId: _a, device_id: _b, id: _c, ...rest } = parsed;
    const dataString = Object.keys(rest).length > 0
      ? JSON.stringify(rest)
      : raw;

    // ── 4. Vérification & création du Device (logique EXCLUSIVEMENT backend) ──
    let device = await this.prisma.device.findUnique({
      where: { deviceId },
    });

    if (!device) {
      device = await this.prisma.device.create({
        data: { deviceId, type: 'MQTT' },
      });
      this.logger.log(`Nouveau device MQTT créé : ${deviceId} (id=${device.id})`);
    }

    // ── 5. Sauvegarde de l'Event ──
    const event = await this.prisma.event.create({
      data: {
        data: dataString,
        deviceId: device.id,
      },
    });

    this.logger.log(`Event MQTT #${event.id} sauvegardé pour device "${deviceId}"`);

    // ── 6. Émission WebSocket vers le frontend ──
    this.gateway.emitNewEvent({ event, device });
  }

  // ── Publication sur un topic (utilitaire) ──
  publish(topic: string, payload: Record<string, any>) {
    if (!this.client?.connected) {
      this.logger.warn('Impossible de publier : client MQTT non connecté.');
      return;
    }
    this.client.publish(topic, JSON.stringify(payload), { qos: 1 });
  }

  // ── Simulation sans broker ──
  simulateMessage(payload: Record<string, any>) {
    const topic = process.env.MQTT_TOPIC || 'devices/data';
    this.parseAndSave(topic, JSON.stringify(payload)).catch((e) =>
      this.logger.error(`Erreur simulation MQTT : ${e.message}`),
    );
  }
}
