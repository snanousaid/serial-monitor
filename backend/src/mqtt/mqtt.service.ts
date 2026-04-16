import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as mqtt from 'mqtt';
import { Device } from '../entities/device.entity';
import { Event } from '../entities/event.entity';
import { SerialGateway } from '../gateway/serial.gateway';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client: mqtt.MqttClient | null = null;

  constructor(
    @InjectRepository(Device) private readonly deviceRepo: Repository<Device>,
    @InjectRepository(Event)  private readonly eventRepo:  Repository<Event>,
    private readonly gateway: SerialGateway,
  ) {}

  onModuleInit() {
    this.connect();
  }

  onModuleDestroy() {
    this.client?.end();
  }

  async restart() {
    await new Promise<void>((resolve) => {
      if (!this.client) return resolve();
      this.client.end(true, {}, () => resolve());
    });
    this.client = null;
    this.connect();
  }

  private connect() {
    const brokerUrl = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
    const topic    = process.env.MQTT_TOPIC    || 'devices/data';
    const clientId = process.env.MQTT_CLIENT_ID || 'serial-monitor-backend';
    const username = process.env.MQTT_USERNAME || undefined;
    const password = process.env.MQTT_PASSWORD || undefined;

    this.logger.log(`Connexion au broker MQTT : ${brokerUrl}`);

    this.client = mqtt.connect(brokerUrl, {
      clientId,
      username,
      password,
      reconnectPeriod: 5000,
      connectTimeout: 10000,
    });

    this.client.on('connect', () => {
      this.logger.log(`Connecté au broker MQTT. Abonnement au topic : "${topic}"`);
      this.client!.subscribe(topic, { qos: 1 }, (err) => {
        if (err) this.logger.error(`Erreur abonnement : ${err.message}`);
      });
    });

    this.client.on('message', (receivedTopic: string, payload: Buffer) => {
      this.parseAndSave(receivedTopic, payload.toString()).catch((e) =>
        this.logger.error(`Erreur sauvegarde MQTT : ${e.message}`),
      );
    });

    this.client.on('reconnect', () => this.logger.warn('Reconnexion MQTT...'));
    this.client.on('error', (err) => this.logger.error(`Erreur MQTT : ${err.message}`));
    this.client.on('offline', () => this.logger.warn('Client MQTT hors-ligne.'));
  }

  private async parseAndSave(topic: string, raw: string) {
    let parsed: Record<string, any>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      this.logger.warn(`Payload ignoré (JSON invalide) sur "${topic}" : ${raw}`);
      return;
    }

    const deviceId = parsed.deviceId ?? parsed.device_id ?? parsed.id;
    if (!deviceId || typeof deviceId !== 'string') {
      this.logger.warn(`Champ "deviceId" manquant : ${raw}`);
      return;
    }

    const { deviceId: _a, device_id: _b, id: _c, ...rest } = parsed;
    const dataString = Object.keys(rest).length > 0
      ? JSON.stringify(rest)
      : raw;

    let device = await this.deviceRepo.findOne({ where: { deviceId } });

    if (!device) {
      device = this.deviceRepo.create({ deviceId, type: 'MQTT' });
      device = await this.deviceRepo.save(device);
      this.logger.log(`Nouveau device MQTT créé : ${deviceId} (id=${device.id})`);
    }

    const event = await this.eventRepo.save(
      this.eventRepo.create({ data: dataString, deviceId: device.id }),
    );

    this.logger.log(`Event MQTT #${event.id} sauvegardé pour device "${deviceId}"`);

    this.gateway.emitNewEvent({ event, device });
  }

  publish(topic: string, payload: Record<string, any>) {
    if (!this.client?.connected) {
      this.logger.warn('Publication impossible : client MQTT non connecté.');
      return;
    }
    this.client.publish(topic, JSON.stringify(payload), { qos: 1 });
  }

  simulateMessage(payload: Record<string, any>) {
    const topic = process.env.MQTT_TOPIC || 'devices/data';
    this.parseAndSave(topic, JSON.stringify(payload)).catch((e) =>
      this.logger.error(`Erreur simulation MQTT : ${e.message}`),
    );
  }
}
