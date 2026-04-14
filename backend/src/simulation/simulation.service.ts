import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../entities/device.entity';
import { Event } from '../entities/event.entity';
import { SerialGateway } from '../gateway/serial.gateway';

/**
 * ─────────────────────────────────────────────────────────
 *  SERVICE DE SIMULATION (TEST)
 *  Démarrage auto si SIMULATION_ENABLED=true dans .env.
 *  Toggleable à chaud via POST /config/simulation {enabled:bool}.
 *
 *  Pour supprimer proprement :
 *    1. rm -rf src/simulation/
 *    2. retirer SimulationModule de app.module.ts
 *    3. retirer SimulationModule de config.module.ts
 * ─────────────────────────────────────────────────────────
 */

const INTERVAL_MS    = 30_000;
const PHASE_1_END_MS = 120_000;
const PHASE_2_END_MS = 240_000;
const DEV_1 = 'DEV001';
const DEV_2 = 'DEV002';

@Injectable()
export class SimulationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SimulationService.name);
  private timer: NodeJS.Timeout | null = null;
  private startedAt = 0;
  private tickCount = 0;

  constructor(
    @InjectRepository(Device) private readonly deviceRepo: Repository<Device>,
    @InjectRepository(Event)  private readonly eventRepo:  Repository<Event>,
    private readonly gateway: SerialGateway,
  ) {}

  onModuleInit() {
    if (process.env.SIMULATION_ENABLED === 'true') {
      this.start();
    } else {
      this.logger.log('Simulation désactivée au démarrage.');
    }
  }

  onModuleDestroy() {
    this.stop();
  }

  isRunning(): boolean {
    return this.timer !== null;
  }

  start() {
    if (this.timer) return;
    this.logger.warn('⚙️  Simulation DÉMARRÉE.');
    this.startedAt = Date.now();
    this.tickCount = 0;
    this.tick();
    this.timer = setInterval(() => this.tick(), INTERVAL_MS);
  }

  stop() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
    this.logger.warn('⏹  Simulation ARRÊTÉE.');
  }

  private async tick() {
    const elapsed = Date.now() - this.startedAt;
    this.tickCount++;

    if (elapsed < PHASE_1_END_MS) {
      await this.emit(DEV_1);
    } else if (elapsed < PHASE_2_END_MS) {
      await this.emit(DEV_2);
    } else {
      await this.emit(this.tickCount % 2 === 0 ? DEV_1 : DEV_2);
    }
  }

  private async emit(deviceId: string) {
    const payload = deviceId === DEV_1
      ? {
          temperature: +(20 + Math.random() * 5).toFixed(2),
          humidity:    +(50 + Math.random() * 10).toFixed(1),
          pressure:    +(1010 + Math.random() * 8).toFixed(1),
        }
      : {
          temperature: +(22 + Math.random() * 4).toFixed(2),
          humidity:    +(55 + Math.random() * 10).toFixed(1),
        };

    try {
      let device = await this.deviceRepo.findOne({ where: { deviceId } });
      if (!device) {
        device = this.deviceRepo.create({ deviceId, type: 'Simulation' });
        device = await this.deviceRepo.save(device);
        this.logger.log(`Nouveau device simulé : ${deviceId}`);
      }

      const event = await this.eventRepo.save(
        this.eventRepo.create({ data: JSON.stringify(payload), deviceId: device.id }),
      );

      this.logger.debug(`[SIM] ${deviceId} → ${JSON.stringify(payload)}`);
      this.gateway.emitNewEvent({ event, device });
    } catch (e: any) {
      this.logger.error(`Erreur simulation : ${e.message}`);
    }
  }
}
